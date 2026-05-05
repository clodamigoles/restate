const PAYPAL_API =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Impossible d\'obtenir le token PayPal');
  return data.access_token;
}

/**
 * Crée une commande PayPal et retourne l'orderID.
 * amount en centimes → converti en euros pour PayPal.
 */
export async function createPayPalOrder(amountCents, currency = 'EUR', bookingId) {
  const token = await getAccessToken();
  const amount = (amountCents / 100).toFixed(2);

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: bookingId,
          amount: {
            currency_code: currency,
            value: amount,
          },
          description: `Réservation Maxo Destinations #${bookingId}`,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!data.id) throw new Error(data.message || 'Erreur création commande PayPal');
  return data.id;
}

/**
 * Capture (confirme) le paiement d'une commande PayPal.
 * Retourne les détails de la capture.
 */
export async function capturePayPalOrder(orderId) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (data.status !== 'COMPLETED') {
    throw new Error(data.message || 'Capture PayPal échouée');
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    orderId: data.id,
    captureId: capture?.id,
    status: data.status,
  };
}

/**
 * Vérifie la signature d'un webhook PayPal.
 * Retourne true si valide.
 */
export async function verifyWebhookSignature({ headers, rawBody, webhookId }) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}
