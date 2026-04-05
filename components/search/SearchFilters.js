import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, AMENITY_LABELS, AMENITY_CATEGORIES, getLabel } from '@/lib/constants';
import { SlidersHorizontal, X, Star, Minus, Plus } from 'lucide-react';

// Filtres populaires (raccourcis) — type ou amenity
const POPULAR_FILTERS = [
  { label: 'Maison vacances / Gite', type: 'gite' },
  { label: "Chambre d'hotes", type: 'chambre_hotes' },
  { label: 'Animaux acceptes', amenity: 'pets_allowed' },
  { label: 'Piscine', amenity: 'pool' },
  { label: 'Appartement vacances', type: 'apartment' },
  { label: 'Chalet', type: 'chalet' },
  { label: 'Parking', amenity: 'parking' },
  { label: 'Villa', type: 'villa' },
  { label: 'Piscine privee', amenity: 'private_pool' },
];

// Groupes d'equipements affiches dans les filtres (sans les vues et enfants, affiches separement)
const AMENITY_FILTER_GROUPS = AMENITY_CATEGORIES.filter(
  (c) => !['views', 'children'].includes(c.key)
);

// Seuils de distance en metres
const DISTANCE_THRESHOLDS = {
  transport: [
    { label: '< 500m', value: 500 },
    { label: '< 750m', value: 750 },
    { label: '< 1km', value: 1000 },
  ],
  beach:  [{ label: '< 1km', value: 1000 }, { label: '< 3km', value: 3000 }, { label: '< 10km', value: 10000 }],
  center: [{ label: '< 1km', value: 1000 }, { label: '< 3km', value: 3000 }, { label: '< 10km', value: 10000 }],
  coast:  [{ label: '< 1km', value: 1000 }, { label: '< 3km', value: 3000 }, { label: '< 10km', value: 10000 }],
  lake:   [{ label: '< 1km', value: 1000 }, { label: '< 3km', value: 3000 }, { label: '< 10km', value: 10000 }],
  ski:    [{ label: '< 1km', value: 1000 }, { label: '< 3km', value: 3000 }, { label: '< 10km', value: 10000 }],
};

const DISTANCE_LABELS = {
  transport: 'Distance transports en commun',
  beach:     'Distance de la plage',
  center:    'Distance centre-ville / village',
  coast:     'Distance de la cote',
  lake:      "Distance d'un lac",
  ski:       "Distance domaine skiable",
};

const RATING_OPTIONS = [
  { label: "N'importe quel", value: '' },
  { label: '9.0 & plus', value: '9' },
  { label: '8.0 & plus', value: '8' },
  { label: '7.0 & plus', value: '7' },
  { label: '6.0 & plus', value: '6' },
  { label: 'Sans avis', value: 'none' },
];

function emptyFilters() {
  return {
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: 0,
    bathrooms: 0,
    capacity: '',
    amenities: [],
    minRating: '',
    maxDistanceTransport: '',
    maxDistanceBeach: '',
    maxDistanceCenter: '',
    maxDistanceCoast: '',
    maxDistanceLake: '',
    maxDistanceSki: '',
  };
}

function filtersFromQuery(q) {
  return {
    type: q.type || '',
    minPrice: q.minPrice || '',
    maxPrice: q.maxPrice || '',
    bedrooms: parseInt(q.bedrooms) || 0,
    bathrooms: parseInt(q.bathrooms) || 0,
    capacity: q.capacity || '',
    amenities: q.amenities ? q.amenities.split(',').filter(Boolean) : [],
    minRating: q.minRating || '',
    maxDistanceTransport: q.maxDistanceTransport || '',
    maxDistanceBeach: q.maxDistanceBeach || '',
    maxDistanceCenter: q.maxDistanceCenter || '',
    maxDistanceCoast: q.maxDistanceCoast || '',
    maxDistanceLake: q.maxDistanceLake || '',
    maxDistanceSki: q.maxDistanceSki || '',
  };
}

export default function SearchFilters() {
  const router = useRouter();
  const q = router.query;
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState(() => filtersFromQuery(q));

  useEffect(() => {
    setFilters(filtersFromQuery(q));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // resync when panel opens

  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (a) =>
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));

  const togglePopular = (pf) => {
    if (pf.type) set('type', filters.type === pf.type ? '' : pf.type);
    if (pf.amenity) toggleAmenity(pf.amenity);
  };

  const isPopularActive = (pf) => {
    if (pf.type) return filters.type === pf.type;
    if (pf.amenity) return filters.amenities.includes(pf.amenity);
    return false;
  };

  const setDistance = (key, value) => set(key, filters[key] == value ? '' : String(value));

  function applyFilters() {
    const params = new URLSearchParams();
    // Preserve non-filter params
    if (q.city) params.set('city', q.city);
    if (q.checkIn) params.set('checkIn', q.checkIn);
    if (q.checkOut) params.set('checkOut', q.checkOut);

    if (filters.type) params.set('type', filters.type);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.bedrooms > 0) params.set('bedrooms', filters.bedrooms);
    if (filters.bathrooms > 0) params.set('bathrooms', filters.bathrooms);
    if (filters.capacity) params.set('capacity', filters.capacity);
    if (filters.amenities.length) params.set('amenities', filters.amenities.join(','));
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (q.sort) params.set('sort', q.sort);

    // Distances
    ['Transport', 'Beach', 'Center', 'Coast', 'Lake', 'Ski'].forEach((d) => {
      const k = `maxDistance${d}`;
      if (filters[k]) params.set(k, filters[k]);
    });

    router.push(`/listings?${params.toString()}`);
    setOpen(false);
  }

  function resetFilters() {
    setFilters(emptyFilters());
    const params = new URLSearchParams();
    if (q.city) params.set('city', q.city);
    if (q.sort) params.set('sort', q.sort);
    router.push(`/listings?${params.toString()}`);
    setOpen(false);
  }

  const activeCount = [
    filters.type, filters.minPrice, filters.maxPrice,
    filters.bedrooms > 0 ? '1' : '',
    filters.bathrooms > 0 ? '1' : '',
    filters.capacity, filters.minRating,
    filters.maxDistanceTransport, filters.maxDistanceBeach,
    filters.maxDistanceCenter, filters.maxDistanceCoast,
    filters.maxDistanceLake, filters.maxDistanceSki,
  ].filter(Boolean).length + filters.amenities.length;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="relative gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Filtres
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold">Filtres</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Filtres populaires ── */}
              <FilterSection title="Filtres populaires">
                <div className="flex flex-wrap gap-2">
                  {POPULAR_FILTERS.map((pf) => (
                    <button
                      key={pf.label}
                      onClick={() => togglePopular(pf)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        isPopularActive(pf)
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'hover:border-primary/40'
                      }`}
                    >
                      {isPopularActive(pf) && (
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-[10px] text-white">✓</span>
                      )}
                      {pf.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ── Type de logement ── */}
              <FilterSection title="Type de logement">
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((k) => (
                    <button
                      key={k}
                      onClick={() => set('type', filters.type === k ? '' : k)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        filters.type === k
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'hover:border-primary/40'
                      }`}
                    >
                      {getLabel(PROPERTY_TYPE_LABELS, k)}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ── Prix ── */}
              <FilterSection title="Prix par nuit (€)">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => set('minPrice', e.target.value)}
                    min={0}
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => set('maxPrice', e.target.value)}
                    min={0}
                  />
                </div>
              </FilterSection>

              {/* ── Chambres ── */}
              <FilterSection title="Chambres">
                <div className="space-y-4">
                  <Counter
                    label="Chambres"
                    value={filters.bedrooms}
                    onChange={(v) => set('bedrooms', v)}
                  />
                  <Counter
                    label="Salles de bain"
                    value={filters.bathrooms}
                    onChange={(v) => set('bathrooms', v)}
                  />
                  <Counter
                    label="Voyageurs minimum"
                    value={parseInt(filters.capacity) || 0}
                    onChange={(v) => set('capacity', v > 0 ? String(v) : '')}
                  />
                </div>
              </FilterSection>

              {/* ── Equipements ── */}
              <FilterSection title="Equipements">
                <div className="space-y-5">
                  {AMENITY_FILTER_GROUPS.map((cat) => (
                    <div key={cat.key}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {cat.label.fr}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.amenities.map((a) => (
                          <button
                            key={a}
                            onClick={() => toggleAmenity(a)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              filters.amenities.includes(a)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'hover:border-primary/40'
                            }`}
                          >
                            {getLabel(AMENITY_LABELS, a)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </FilterSection>

              {/* ── Super pour les enfants ── */}
              <FilterSection title="Super pour les enfants">
                <div className="flex flex-wrap gap-2">
                  {AMENITY_CATEGORIES.find((c) => c.key === 'children')?.amenities.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        filters.amenities.includes(a)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:border-primary/40'
                      }`}
                    >
                      {getLabel(AMENITY_LABELS, a)}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ── Avis des voyageurs ── */}
              <FilterSection title="Avis des voyageurs">
                <div className="space-y-2">
                  {RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => set('minRating', opt.value)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                        filters.minRating === opt.value
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'hover:border-primary/40'
                      }`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        filters.minRating === opt.value ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {filters.minRating === opt.value && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      {opt.value && opt.value !== 'none' && (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ── Vue de la propriete ── */}
              <FilterSection title="Vue de la propriete">
                <div className="flex flex-wrap gap-2">
                  {['sea_view', 'lake_view', 'mountain_view'].map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        filters.amenities.includes(a)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:border-primary/40'
                      }`}
                    >
                      {getLabel(AMENITY_LABELS, a)}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ── Distances ── */}
              {Object.entries(DISTANCE_THRESHOLDS).map(([key, thresholds]) => (
                <FilterSection key={key} title={DISTANCE_LABELS[key]}>
                  <div className="flex gap-2">
                    {thresholds.map(({ label, value }) => {
                      const paramKey = `maxDistance${key.charAt(0).toUpperCase() + key.slice(1)}`;
                      return (
                        <button
                          key={value}
                          onClick={() => setDistance(paramKey, value)}
                          className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                            filters[paramKey] == value
                              ? 'border-primary bg-primary/10 font-medium text-primary'
                              : 'hover:border-primary/40'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>
              ))}
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t px-5 py-4">
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Reinitialiser
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                Voir les annonces
                {activeCount > 0 && ` (${activeCount})`}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="border-b px-5 py-5">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Counter({ label, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
