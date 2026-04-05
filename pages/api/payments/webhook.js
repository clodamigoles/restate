import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import { verifyWebhookSignature } from '@/lib/paypal';

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const rawBody = await getRawBody(req);

  try {
    const isValid = await verifyWebhookSignature({
      headers: req.headers,
      rawBody,
      webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    });

    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Signature invalide' });
    }
  } catch {
    // En dev, on ignore la vérification si les vars sont absentes
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Vérification signature échouée' });
    }
  }

  await dbConnect();

  const event = JSON.parse(rawBody);
  const { event_type, resource } = event;

  if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    await Payment.findOneAndUpdate(
      { paypalCaptureId: resource.id },
      { status: 'completed' }
    );
  }

  if (event_type === 'PAYMENT.CAPTURE.REFUNDED') {
    const payment = await Payment.findOneAndUpdate(
      { paypalCaptureId: resource.id },
      { status: 'refunded' },
      { new: true }
    );
    if (payment) {
      await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'refunded' });
    }
  }

  return res.status(200).json({ received: true });
}
