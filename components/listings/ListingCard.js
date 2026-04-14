import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Users, BedDouble } from 'lucide-react';
import { formatPrice, PROPERTY_TYPE_LABELS, getLabel } from '@/lib/constants';
import { getLocalizedField } from '@/lib/i18n';
import { useLocale } from '@/hooks/useLocale';

export default function ListingCard({ listing }) {
  const { locale, t } = useLocale();

  const cover = listing.images?.[0] || '/placeholder.jpg';
  const title = t(listing.title);
  const price = formatPrice(listing.pricePerNight);
  const type = getLabel(PROPERTY_TYPE_LABELS, listing.type, locale);

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

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <span className="absolute left-3 top-3 rounded-lg bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          {type}
        </span>
        {listing.isFeatured && (
          <span className="absolute right-3 top-3 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
            Vedette
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{title}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="truncate">{listing.location?.city}</span>
        </p>

        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            {listing.bedrooms} ch.
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            {listing.capacity} pers.
          </span>
          {listing.averageRating > 0 && (
            <span className="ml-auto flex items-center gap-1.5 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />
              {listing.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-1 border-t border-border pt-3">
          <span className="font-display text-lg font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground">/ nuit</span>
        </div>
      </div>
    </Link>
  );
}
