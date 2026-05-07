import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function t(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || Object.values(field).find((v) => v) || '';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function adminNewBookingEmail({ userName, userEmail, listing, booking, adminUrl }) {
  const isInstant = booking.status === 'confirmed';

  return {
    subject: `[Nouvelle réservation] ${t(listing.title)} — ${userName}`,
    html: emailLayout({
      title: 'Nouvelle réservation',
      preheader: `${userName} vient de réserver ${t(listing.title)}.`,
      content: `
        <h2>Nouvelle réservation reçue</h2>
        <p>Un client vient d'effectuer une réservation sur votre plateforme.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Client</span>
            <span class="value">${userName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email</span>
            <span class="value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Logement</span>
            <span class="value">${t(listing.title)}</span>
          </div>
          <div class="info-row">
            <span class="label">Arrivée</span>
            <span class="value">${formatDate(booking.checkIn)}</span>
          </div>
          <div class="info-row">
            <span class="label">Départ</span>
            <span class="value">${formatDate(booking.checkOut)}</span>
          </div>
          <div class="info-row">
            <span class="label">Voyageurs</span>
            <span class="value">${booking.guests} personne${booking.guests > 1 ? 's' : ''}</span>
          </div>
          <div class="info-row">
            <span class="label">Durée</span>
            <span class="value">${booking.nights} nuit${booking.nights > 1 ? 's' : ''}</span>
          </div>
          <div class="info-row">
            <span class="label">Statut</span>
            <span class="value">
              <span class="badge ${isInstant ? 'badge-success' : 'badge-warning'}">
                ${isInstant ? 'Confirmée' : 'En attente'}
              </span>
            </span>
          </div>
          <div class="total-row">
            <span>Total</span>
            <span>${formatPrice(booking.totalPrice)}</span>
          </div>
        </div>

        ${booking.specialRequests ? `
        <p><strong>Demande spéciale :</strong><br>${booking.specialRequests}</p>
        ` : ''}

        <p style="text-align:center;">
          <a href="${adminUrl}" class="btn">Voir la réservation</a>
        </p>
      `,
    }),
  };
}

export function adminNewReceiptEmail({ userName, userEmail, listing, booking, proofCount, adminUrl }) {
  return {
    subject: `[Récipissé reçu] ${t(listing.title)} — ${userName}`,
    html: emailLayout({
      title: 'Récipissé de virement reçu',
      preheader: `${userName} a soumis un justificatif de virement pour ${t(listing.title)}.`,
      content: `
        <h2>Justificatif de virement reçu</h2>
        <p>Un client vient de soumettre ${proofCount > 1 ? `${proofCount} justificatifs` : 'un justificatif'} de virement bancaire. Veuillez valider le paiement dans votre tableau de bord.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Client</span>
            <span class="value">${userName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email</span>
            <span class="value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Logement</span>
            <span class="value">${t(listing.title)}</span>
          </div>
          <div class="info-row">
            <span class="label">Arrivée</span>
            <span class="value">${formatDate(booking.checkIn)}</span>
          </div>
          <div class="info-row">
            <span class="label">Départ</span>
            <span class="value">${formatDate(booking.checkOut)}</span>
          </div>
          <div class="info-row">
            <span class="label">Total à valider</span>
            <span class="value">${formatPrice(booking.totalPrice)}</span>
          </div>
          <div class="info-row">
            <span class="label">Fichiers soumis</span>
            <span class="value">${proofCount} fichier${proofCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        <p style="text-align:center;">
          <a href="${adminUrl}" class="btn">Valider le paiement</a>
        </p>
      `,
    }),
  };
}
