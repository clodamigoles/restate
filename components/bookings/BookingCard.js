import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Calendar } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';
import { formatPrice } from '@/lib/constants';

export default function BookingCard({ booking }) {
  const listing = booking.listing;
  const cover = listing?.images?.[0] || '/placeholder.jpg';

  return (
    <Link
      href={`/bookings/${booking._id}`}
      className="flex gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image src={cover} alt={listing?.title?.fr || listing?.title || ''} fill className="object-cover" />
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{listing?.title?.fr || listing?.title}</h3>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {listing?.location?.city}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(booking.checkIn), 'd MMM', { locale: fr })}
            {' — '}
            {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: fr })}
            {' · '}{booking.nights} nuit{booking.nights > 1 ? 's' : ''}
          </span>
          <span className="font-semibold text-primary">{formatPrice(booking.totalPrice)}</span>
        </div>
      </div>
    </Link>
  );
}
