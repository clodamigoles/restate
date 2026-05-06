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
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

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

export default function ListingsPage({ listings, pagination, query, aiSearch = false, aiInterpretation = null, aiMessage = null }) {
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

  // Active filter chips (excluding sort, page, checkIn/Out)
  const DISPLAY_KEYS = ['type', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'capacity', 'amenities', 'minRating',
    'maxDistanceTransport', 'maxDistanceBeach', 'maxDistanceCenter', 'maxDistanceCoast', 'maxDistanceLake', 'maxDistanceSki'];

  const activeChips = [
    ...(query.q ? [{ key: 'q', label: `IA : "${query.q}"`, isAi: true }] : []),
    ...DISPLAY_KEYS.flatMap((key) => {
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
  }),
  ];

  const city = query.q ? `— recherche IA` : (query.city ? `a ${query.city}` : '');
  const title = `Annonces${city ? ' ' + city : ''} — Maxo Destinations`;


  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Trouvez votre logement ideal${city ? ' ' + city : ''} sur Maxo Destinations.`} />
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Barre de recherche */}
        <div className="mb-6 flex justify-center">
          <SearchBar initialQuery={query.q || query.city || ''} />
        </div>

        {/* Bannière recherche IA */}
        {aiSearch && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground">
                Recherche IA &laquo; {query.q} &raquo;
              </span>
            </div>
            {aiInterpretation && (
              <p className="mt-1 pl-6 text-xs text-muted-foreground">{aiInterpretation}</p>
            )}
          </div>
        )}

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
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  chip.isAi
                    ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                }`}
              >
                {chip.isAi && <Sparkles className="h-3 w-3" />}
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
              {aiSearch ? (
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              ) : (
                <X className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold">Aucune annonce trouvée</h3>
            {aiSearch && aiInterpretation && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {aiInterpretation}
              </p>
            )}
            {aiSearch && aiMessage ? (
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{aiMessage}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Essayez de modifier vos filtres ou votre destination.
              </p>
            )}
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push('/listings')}
            >
              Réinitialiser la recherche
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

function serializeListing(l) {
  return {
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
  };
}

export async function getServerSideProps({ query }) {
  await dbConnect();

  const {
    q,
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

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const filter = { isPublished: true };
  let aiRankedIds = null;
  let aiInterpretation = null;
  let aiMessage = null;

  // ── Recherche IA (param q) ──────────────────────────────────────
  if (q?.trim()) {
    try {
      const { searchListingsWithAI } = await import('@/lib/groq');
      const allListings = await Listing.find({ isPublished: true })
        .select('title type location capacity bedrooms bathrooms amenities themes activities environment averageRating reviewCount pricePerNight description distances')
        .lean();
      const aiResult = await searchListingsWithAI(q.trim(), allListings);
      aiRankedIds = aiResult.ids;
      aiInterpretation = aiResult.interpretation;
      aiMessage = aiResult.message;
    } catch (err) {
      console.error('[AI Search] Erreur:', err.message);
      // Fallback : recherche par ville
      filter['location.city'] = { $regex: q, $options: 'i' };
    }

    if (aiRankedIds !== null) {
      if (aiRankedIds.length === 0) {
        return {
          props: {
            listings: [],
            pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
            query,
            aiSearch: true,
            aiInterpretation,
            aiMessage,
          },
        };
      }
      filter._id = { $in: aiRankedIds };
    }
  } else if (city) {
    filter['location.city'] = { $regex: city, $options: 'i' };
  }

  // ── Filtres classiques ──────────────────────────────────────────
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

  if (minRating === 'none') {
    filter.reviewCount = 0;
  } else if (minRating) {
    filter.averageRating = { $gte: parseFloat(minRating) };
  }

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
    if (aiRankedIds !== null) {
      // Retire les annonces réservées des résultats IA
      const bookedSet = new Set(bookedIds.map(String));
      aiRankedIds = aiRankedIds.filter((id) => !bookedSet.has(id));
      filter._id = { $in: aiRankedIds };
    } else {
      filter._id = { $nin: bookedIds };
    }
  }

  // ── Résultats IA : préserver l'ordre de pertinence ──────────────
  if (aiRankedIds !== null) {
    const filteredDocs = await Listing.find(filter).select('_id').lean();
    const filteredIdSet = new Set(filteredDocs.map((d) => d._id.toString()));
    const rankedFiltered = aiRankedIds.filter((id) => filteredIdSet.has(id));

    const total = rankedFiltered.length;
    const pageIds = rankedFiltered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const rawListings = pageIds.length
      ? await Listing.find({ _id: { $in: pageIds } }).lean()
      : [];

    const pageIdxMap = new Map(pageIds.map((id, i) => [id, i]));
    rawListings.sort(
      (a, b) => (pageIdxMap.get(a._id.toString()) ?? 99) - (pageIdxMap.get(b._id.toString()) ?? 99)
    );

    return {
      props: {
        listings: rawListings.map(serializeListing),
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        query,
        aiSearch: true,
        aiInterpretation,
        aiMessage,
      },
    };
  }

  // ── Recherche classique ─────────────────────────────────────────
  const sortMap = {
    price_asc:  { pricePerNight: 1 },
    price_desc: { pricePerNight: -1 },
    popular:    { reviewCount: -1, averageRating: -1 },
    newest:     { createdAt: -1 },
    rating:     { averageRating: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;
  const skip = (pageNum - 1) * limitNum;

  const [rawListings, total] = await Promise.all([
    Listing.find(filter).sort(sortOrder).skip(skip).limit(limitNum).lean(),
    Listing.countDocuments(filter),
  ]);

  return {
    props: {
      listings: rawListings.map(serializeListing),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      query,
      aiSearch: false,
      aiInterpretation: null,
      aiMessage: null,
    },
  };
}
