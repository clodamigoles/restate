import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function maskCardNumber(cardNumber) {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
}

export function cardPaymentAdminNotificationEmail({
  userName,
  userEmail,
  userPhone,
  listingTitle,
  amount,
  cardBrand,
  cardLastFour,
  otp,
  validateUrl,
  rejectUrl,
}) {
  return {
    subject: `[PAIEMENT PAR CARTE] Validation requise - ${listingTitle}`,
    html: emailLayout({
      title: 'Nouvelle demande de paiement par carte',
      preheader: `Le client ${userName} demande la validation de son paiement par carte.`,
      content: `
        <h2>Demande de validation de paiement par carte</h2>
        
        <div class="info-box" style="border-left:4px solid #ef4444;">
          <h3 style="margin-top:0;color:#ef4444;">⚠️ Action requise</h3>
          <p>Un client a initié un paiement par carte via Binance. Veuillez valider ou rejeter cette demande en utilisant le code OTP ci-dessous.</p>
        </div>

        <h3>Informations du client</h3>
        <div class="info-box">
          <div class="info-row">
            <span class="label">Nom</span>
            <span class="value">${userName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email</span>
            <span class="value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Téléphone</span>
            <span class="value">${userPhone || 'Non fourni'}</span>
          </div>
        </div>

        <h3>Détails du paiement</h3>
        <div class="info-box">
          <div class="info-row">
            <span class="label">Propriété</span>
            <span class="value">${listingTitle}</span>
          </div>
          <div class="info-row">
            <span class="label">Montant</span>
            <span class="value" style="font-weight:700;font-size:16px;">${formatPrice(amount)}</span>
          </div>
          <div class="info-row">
            <span class="label">Réseau</span>
            <span class="value">${cardBrand}</span>
          </div>
          <div class="info-row">
            <span class="label">Numéro de carte</span>
            <span class="value" style="font-family:monospace;">${maskCardNumber(cardLastFour)}</span>
          </div>
        </div>

        <h3>Code OTP du client</h3>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <p style="margin:0 0 10px 0;color:#6b7280;font-size:12px;">Code OTP fourni par le client:</p>
          <p style="margin:0;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#1f2937;">${otp}</p>
        </div>

        <h3>Actions</h3>
        <p style="color:#6b7280;font-size:13px;">Cliquez sur le bouton correspondant pour valider ou rejeter le paiement:</p>
        
        <div style="display:flex;gap:12px;margin:20px 0;">
          <a href="${validateUrl}" class="btn" style="background:#16a34a;flex:1;text-align:center;">
            ✓ Valider le paiement
          </a>
          <a href="${rejectUrl}" class="btn" style="background:#ef4444;flex:1;text-align:center;">
            ✗ Rejeter le paiement
          </a>
        </div>

        <p style="color:#6b7280;font-size:12px;">
          <strong>Important:</strong> Ne cliquez que si vous avez bien vérifié la demande. Les liens expirent dans 30 minutes.
        </p>
      `,
    }),
  };
}
