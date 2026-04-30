import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Users, BedDouble, Zap, Ruler } from 'lucide-react';
import { formatPrice, PROPERTY_TYPE_LABELS, getLabel } from '@/lib/constants';
import { getLocalizedField } from '@/lib/i18n';
import { useLocale } from '@/hooks/useLocale';

export default function ListingCard({ listing }) {
  const { locale, t } = useLocale();

  const cover = listing.images?.[0] || '/placeholder.jpg';
  const title = t(listing.title);
  const price = formatPrice(listing.pricePerNight);
  const type = getLabel(PROPERTY_TYPE_LABELS, listing.type, locale);

  // Premiers tags environnement (max 2)
  const envTags = listing.environment?.slice(0, 2) || [];

  return (
    <Link
      href={`/listings/${listing.slug || listing._id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={cover}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Type badge */}
        <span className="absolute left-3 top-3 rounded-lg bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          {type}
        </span>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {listing.isFeatured && (
            <span className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
              Vedette
            </span>
          )}
          {listing.instantBooking && (
            <span className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-xs font-semibold text-white shadow-sm">
              <Zap className="h-3 w-3" />
              Instant
            </span>
          )}
        </div>

        {/* Label certification (bottom left) */}
        {listing.label && (
          <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {listing.label}
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="truncate">{listing.location?.city}</span>
          {listing.location?.region && (
            <span className="truncate text-xs opacity-70">· {listing.location.region}</span>
          )}
        </p>

        {/* Environnement tags */}
        {envTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {envTags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            {listing.bedrooms} ch.
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            {listing.capacity} pers.
          </span>
          {listing.surface && (
            <span className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 shrink-0 text-primary/50" />
              {listing.surface} m²
            </span>
          )}
          {listing.averageRating > 0 && (
            <span className="ml-auto flex items-center gap-1.5 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />
              {listing.averageRating.toFixed(1)}
              {listing.reviewCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({listing.reviewCount})</span>
              )}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-1 border-t border-border pt-3">
          <span className="font-display text-lg font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground">/ nuit</span>
          {listing.minNights > 1 && (
            <span className="ml-auto text-xs text-muted-foreground">{listing.minNights} nuits min.</span>
          )}
        </div>
      </div>
    </Link>
  );
}
