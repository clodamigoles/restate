import { useRouter } from 'next/router';
import Head from 'next/head';
import ListingGrid from '@/components/listings/ListingGrid';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SortSelect from '@/components/search/SortSelect';
import { Button } from '@/components/ui/Button';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Booking from '@/models/Booking';
import { PROPERTY_TYPE_LABELS, AMENITY_LABELS, getLabel } from '@/lib/constants';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Labels courts pour les filtres actifs dans la toolbar
const RATING_LABELS = { '9': '★ 9+', '8': '★ 8+', '7': '★ 7+', '6': '★ 6+', 'none': 'Sans avis' };
const DISTANCE_SHORT = {
  maxDistanceTransport: 'Transports',
  maxDistanceBeach: 'Plage',
  maxDistanceCenter: 'Centre',
  maxDistanceCoast: 'Cote',
  maxDistanceLake: 'Lac',
  maxDistanceSki: 'Ski',
};

export default function ListingsPage({ listings, pagination, query }) {
  const router = useRouter();
  const { page = 1, total, totalPages } = pagination;

  function goToPage(p) {
    const params = new URLSearchParams(router.query);
    params.set('page', p);
    router.push(`/listings?${params.toString()}`);
  }

  function removeFilter(key) {
    const params = new URLSearchParams(router.query);
    params.delete(key);
    params.delete('page');
    router.push(`/listings?${params.toString()}`);
  }

  // Active filter chips (excluding city, sort, page, checkIn/Out)
  const DISPLAY_KEYS = ['type', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'capacity', 'amenities', 'minRating',
    'maxDistanceTransport', 'maxDistanceBeach', 'maxDistanceCenter', 'maxDistanceCoast', 'maxDistanceLake', 'maxDistanceSki'];

  const activeChips = DISPLAY_KEYS.flatMap((key) => {
    const val = query[key];
    if (!val) return [];
    if (key === 'type') return [{ key, label: getLabel(PROPERTY_TYPE_LABELS, val) }];
    if (key === 'amenities') return val.split(',').map((a) => ({ key: `amenity-${a}`, label: getLabel(AMENITY_LABELS, a), removeKey: key, removeValue: val.split(',').filter((x) => x !== a).join(',') }));
    if (key === 'minRating') return [{ key, label: RATING_LABELS[val] || val }];
    if (key === 'minPrice') return [{ key, label: `Min ${val}€` }];
    if (key === 'maxPrice') return [{ key, label: `Max ${val}€` }];
    if (key === 'bedrooms') return [{ key, label: `${val}+ ch.` }];
    if (key === 'bathrooms') return [{ key, label: `${val}+ sdb` }];
    if (key === 'capacity') return [{ key, label: `${val} pers.` }];
    if (DISTANCE_SHORT[key]) return [{ key, label: `${DISTANCE_SHORT[key]} < ${parseInt(val) >= 1000 ? (parseInt(val) / 1000) + 'km' : val + 'm'}` }];
    return [];
  });

  const city = query.city ? `a ${query.city}` : '';
  const title = `Annonces${city ? ' ' + city : ''} — Restate`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Trouvez votre logement ideal${city ? ' ' + city : ''} sur Restate.`} />
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Barre de recherche */}
        <div className="mb-6 flex justify-center">
          <SearchBar initialCity={query.city || ''} />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span>{' '}
            annonce{total !== 1 ? 's' : ''} trouvee{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <SearchFilters />
            <SortSelect />
          </div>
        </div>

        {/* Filtres actifs */}
        {activeChips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => {
                  if (chip.removeKey) {
                    // Amenity individuel — retire juste celui-la
                    const params = new URLSearchParams(router.query);
                    if (chip.removeValue) {
                      params.set(chip.removeKey, chip.removeValue);
                    } else {
                      params.delete(chip.removeKey);
                    }
                    params.delete('page');
                    router.push(`/listings?${params.toString()}`);
                  } else {
                    removeFilter(chip.key);
                  }
                }}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (query.city) params.set('city', query.city);
                if (query.sort) params.set('sort', query.sort);
                router.push(`/listings?${params.toString()}`);
              }}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Grille */}
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <X className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucune annonce trouvee</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou votre destination.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push('/listings')}
            >
              Reinitialiser la recherche
            </Button>
          </div>
        ) : (
          <ListingGrid listings={listings} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Fenetre de pages autour de la page courante
              let p;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ query }) {
  await dbConnect();

  const {
    city, type, minPrice, maxPrice,
    bedrooms, bathrooms, capacity, amenities,
    checkIn, checkOut,
    minRating,
    maxDistanceTransport, maxDistanceBeach, maxDistanceCenter,
    maxDistanceCoast, maxDistanceLake, maxDistanceSki,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = query;

  const filter = { isPublished: true };

  if (city) filter['location.city'] = { $regex: city, $options: 'i' };
  if (type) filter.type = type;
  if (bedrooms) filter.bedrooms = { $gte: parseInt(bedrooms) };
  if (bathrooms) filter.bathrooms = { $gte: parseInt(bathrooms) };
  if (capacity) filter.capacity = { $gte: parseInt(capacity) };

  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice) * 100;
    if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice) * 100;
  }

  if (amenities) {
    const list = amenities.split(',').filter(Boolean);
    if (list.length) filter.amenities = { $all: list };
  }

  // Filtre note
  if (minRating === 'none') {
    filter.reviewCount = 0;
  } else if (minRating) {
    filter.averageRating = { $gte: parseFloat(minRating) };
  }

  // Filtres distances
  if (maxDistanceTransport) filter['distances.transport'] = { $lte: parseInt(maxDistanceTransport), $ne: null };
  if (maxDistanceBeach)     filter['distances.beach']     = { $lte: parseInt(maxDistanceBeach),     $ne: null };
  if (maxDistanceCenter)    filter['distances.center']    = { $lte: parseInt(maxDistanceCenter),    $ne: null };
  if (maxDistanceCoast)     filter['distances.coast']     = { $lte: parseInt(maxDistanceCoast),     $ne: null };
  if (maxDistanceLake)      filter['distances.lake']      = { $lte: parseInt(maxDistanceLake),      $ne: null };
  if (maxDistanceSki)       filter['distances.ski']       = { $lte: parseInt(maxDistanceSki),       $ne: null };

  if (checkIn && checkOut) {
    const bookedIds = await Booking.distinct('listing', {
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    });
    filter._id = { $nin: bookedIds };
  }

  const sortMap = {
    price_asc:  { pricePerNight: 1 },
    price_desc: { pricePerNight: -1 },
    popular:    { reviewCount: -1, averageRating: -1 },
    newest:     { createdAt: -1 },
    rating:     { averageRating: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [rawListings, total] = await Promise.all([
    Listing.find(filter).sort(sortOrder).skip(skip).limit(parseInt(limit)).lean(),
    Listing.countDocuments(filter),
  ]);

  const listings = rawListings.map((l) => ({
    ...l,
    _id: l._id.toString(),
    owner: l.owner?.toString() || null,
    createdAt: l.createdAt?.toISOString() || null,
    updatedAt: l.updatedAt?.toISOString() || null,
    blockedDates: (l.blockedDates || []).map((d) => ({
      start: d.start?.toISOString() || null,
      end: d.end?.toISOString() || null,
    })),
    seasonalPricing: (l.seasonalPricing || []).map((s) => ({
      ...s,
      _id: s._id?.toString(),
      start: s.start?.toISOString() || null,
      end: s.end?.toISOString() || null,
    })),
    // Champs enrichis
    surface:            l.surface             ?? null,
    toilets:            l.toilets             ?? null,
    floors:             l.floors              ?? null,
    label:              l.label               ?? null,
    stars:              l.stars               ?? null,
    themes:             l.themes              || [],
    activities:         l.activities          || [],
    environment:        l.environment         || [],
    cancellationPolicy: l.cancellationPolicy  ?? null,
    deposit:            l.deposit             ?? null,
    taxeSejour:         l.taxeSejour          ?? null,
    host:               l.host ? { name: l.host.name ?? null, languages: l.host.languages || [] } : null,
    extras:             l.extras              || {},
  }));

  return {
    props: {
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      query,
    },
  };
}
