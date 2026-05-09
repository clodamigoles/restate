import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' \u20ac';
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

export function bookingConfirmationEmail({ userName, listing, booking, bookingUrl }) {
  const isInstant = booking.status === 'confirmed';

  return {
    subject: isInstant
      ? `Réservation confirmée — ${t(listing.title)}`
      : `Demande de réservation reçue — ${t(listing.title)}`,
    html: emailLayout({
      title: 'Confirmation de réservation',
      preheader: `${isInstant ? 'Votre réservation est confirmée' : 'Demande reçue'} pour ${t(listing.title)}.`,
      content: `
        <h2>${isInstant ? 'Réservation confirmée !' : 'Demande de réservation reçue'}</h2>
        <p>Bonjour ${userName},</p>
        <p>${isInstant
          ? `Votre réservation pour <strong>${t(listing.title)}</strong> est <strong>confirmée</strong>. Voici le récapitulatif&nbsp;:`
          : `Nous avons bien reçu votre demande de réservation pour <strong>${t(listing.title)}</strong>. Vous recevrez une confirmation dès validation par notre équipe.`
        }</p>

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
          <div class="total-row">
            <span>Total</span>
            <span>${formatPrice(booking.totalPrice)}</span>
          </div>
        </div>

        ${isInstant && listing.checkInTime ? `
        <p><strong>Informations pratiques&nbsp;:</strong><br>
        Arrivée à partir de ${listing.checkInTime} — Départ avant ${listing.checkOutTime || '11:00'}</p>
        ` : ''}

        <p style="text-align:center;">
          <a href="${bookingUrl}" class="btn">Voir ma réservation</a>
        </p>
      `,
    }),
  };
}
