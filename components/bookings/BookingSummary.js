import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatPrice } from '@/lib/constants';
import BookingStatusBadge from './BookingStatusBadge';

export default function BookingSummary({ booking }) {
  return (
    <div className="space-y-3 rounded-lg border p-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">Récapitulatif</span>
        <BookingStatusBadge status={booking.status} />
      </div>
      <Row label="Arrivée" value={format(new Date(booking.checkIn), 'dd MMMM yyyy', { locale: fr })} />
      <Row label="Départ" value={format(new Date(booking.checkOut), 'dd MMMM yyyy', { locale: fr })} />
      <Row label="Voyageurs" value={`${booking.guests} personne${booking.guests > 1 ? 's' : ''}`} />
      <Row label="Durée" value={`${booking.nights} nuit${booking.nights > 1 ? 's' : ''}`} />
      <hr />
      <Row
        label={`${formatPrice(booking.pricePerNight)} × ${booking.nights} nuit${booking.nights > 1 ? 's' : ''}`}
        value={formatPrice(booking.nights * booking.pricePerNight)}
      />
      {booking.cleaningFee > 0 && (
        <Row label="Frais de ménage" value={formatPrice(booking.cleaningFee)} muted />
      )}
      <Row label="Total" value={formatPrice(booking.totalPrice)} bold />
    </div>
  );
}

function Row({ label, value, muted, bold }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
