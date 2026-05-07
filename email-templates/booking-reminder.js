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

export function bookingReminderEmail({ userName, listing, booking, bookingUrl }) {
  const statusLabels = {
    pending: 'En attente de confirmation',
    confirmed: 'Confirmée',
    cancelled: 'Annulée',
    completed: 'Terminée',
  };

  return {
    subject: `Rappel — votre réservation pour ${t(listing.title)}`,
    html: emailLayout({
      title: 'Rappel de réservation',
      preheader: `Rappel concernant votre réservation pour ${t(listing.title)}.`,
      content: `
        <h2>Rappel concernant votre réservation</h2>
        <p>Bonjour ${userName},</p>
        <p>Notre équipe vous contacte pour vous rappeler les détails de votre réservation pour <strong>${t(listing.title)}</strong>.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Logement</span>
            <span class="value">${t(listing.title)}</span>
          </div>
          <div class="info-row">
            <span class="label">Adresse</span>
            <span class="value">${listing.location?.city || ''}</span>
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
              <span class="badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">
                ${statusLabels[booking.status] || booking.status}
              </span>
            </span>
          </div>
          <div class="total-row">
            <span>Total</span>
            <span>${formatPrice(booking.totalPrice)}</span>
          </div>
        </div>

        <p>Pour toute question ou information complémentaire, n'hésitez pas à nous contacter en répondant à cet email.</p>

        <p style="text-align:center;">
          <a href="${bookingUrl}" class="btn">Voir ma réservation</a>
        </p>
      `,
    }),
  };
}
