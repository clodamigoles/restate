import { emailLayout } from './layout';

function t(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || Object.values(field).find((v) => v) || '';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function bookingCancellationEmail({ userName, listing, booking, cancelledBy, reason }) {
  const byAdmin = cancelledBy === 'admin';

  return {
    subject: `Réservation annulée — ${t(listing.title)}`,
    html: emailLayout({
      title: 'Annulation de réservation',
      preheader: `Votre réservation pour ${t(listing.title)} a été annulée.`,
      content: `
        <h2>Réservation annulée</h2>
        <p>Bonjour ${userName},</p>
        <p>${byAdmin
          ? `Votre réservation pour <strong>${t(listing.title)}</strong> a été annulée par notre équipe.`
          : `Votre réservation pour <strong>${t(listing.title)}</strong> a bien été annulée.`
        }</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Logement</span>
            <span class="value">${t(listing.title)}</span>
          </div>
          <div class="info-row">
            <span class="label">Arrivée prévue</span>
            <span class="value">${formatDate(booking.checkIn)}</span>
          </div>
          <div class="info-row">
            <span class="label">Départ prévu</span>
            <span class="value">${formatDate(booking.checkOut)}</span>
          </div>
          ${reason ? `
          <div class="info-row">
            <span class="label">Motif</span>
            <span class="value">${reason}</span>
          </div>` : ''}
        </div>

        ${byAdmin ? '<p>Si vous avez effectué un paiement, notre équipe vous contactera pour le remboursement.</p>' : ''}
        <p>Vous pouvez réserver un autre logement sur notre plateforme.</p>
        <p style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/listings" class="btn">Voir les annonces</a>
        </p>
      `,
    }),
  };
}
