import formidable from 'formidable';
import fs from 'fs';
import { put } from '@vercel/blob';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import mongoose from 'mongoose';

export const config = {
  api: { bodyParser: false },
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });
  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }
  if (booking.paymentStatus !== 'pending') {
    return res.status(400).json({ success: false, error: 'Aucun virement en attente pour cette réservation' });
  }

  const form = formidable({ keepExtensions: true, maxFileSize: MAX_SIZE, maxFiles: 5 });
  const [, files] = await form.parse(req);

  const fileList = files.receipt || files.file || [];
  const arr = (Array.isArray(fileList) ? fileList : [fileList]).filter(Boolean);

  if (arr.length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
  }

  const uploaded = [];
  for (const file of arr) {
    const isImage = file.mimetype?.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';
    if (!isImage && !isPdf) continue;

    const buffer = fs.readFileSync(file.filepath);
    const filename = `receipts/${id}/${Date.now()}-${file.originalFilename || 'receipt'}`;
    const blob = await put(filename, buffer, { access: 'public', contentType: file.mimetype });
    uploaded.push(blob.url);
    fs.unlink(file.filepath, () => {});
  }

  if (uploaded.length === 0) {
    return res.status(400).json({ success: false, error: 'Format non supporté. Envoyez des images ou des PDF.' });
  }

  const payment = await Payment.findOneAndUpdate(
    { booking: id, method: 'bank_transfer' },
    { $push: { transferProofs: { $each: uploaded } } },
    { new: true }
  );

  return res.status(200).json({ success: true, data: { proofs: payment.transferProofs } });
}

export default errorHandler(withAuth(handler));
