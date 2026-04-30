import Link from 'next/link';
import Image from 'next/image';
import HeroSearch from '@/components/home/HeroSearch';
import ListingCard from '@/components/listings/ListingCard';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import {
  Home, Building2, Castle, TreePine, Warehouse, Star, ArrowRight,
  Waves, Users, Sparkles, Mountain, Moon, Heart, CreditCard, MapPin, Tent,
  Sailboat, Hotel, BedDouble, Coffee, Tractor, Boxes,
} from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getLabel } from '@/lib/constants';

const CATEGORY_ICONS = {
  apartment:     Building2,
  villa:         Castle,
  studio:        Home,
  gite:          TreePine,
  house:         Home,
  space:         Boxes,
  chambre_hotes: BedDouble,
  chalet:        Mountain,
  camping:       Tent,
  ferme:         Tractor,
  bungalow:      Coffee,
  hotel:         Hotel,
  rare:          Sparkles,
  village:       MapPin,
  bateau:        Sailboat,
};

const LODGING_TYPES = [
  {
    label: 'Gites',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=gite',
  },
  {
    label: 'Gites avec piscine',
    icon: Waves,
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=gite&amenity=pool',
  },
  {
    label: 'Location avec chien',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80&auto=format&fit=crop',
    href: '/listings?petFriendly=true',
  },
  {
    label: 'Villas',
    icon: Castle,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=villa',
  },
  {
    label: 'Chalets',
    icon: Mountain,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=chalet',
  },
  {
    label: 'Gites pour groupe',
    icon: Users,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=gite&capacity=10',
  },
  {
    label: 'Gites avec spa',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=gite&amenity=spa',
  },
  {
    label: 'Vacances plain-pied',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80&auto=format&fit=crop',
    href: '/listings?accessible=true',
  },
  {
    label: 'Cheque-vacances',
    icon: CreditCard,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&auto=format&fit=crop',
    href: '/listings?payment=ancv',
  },
  {
    label: 'Nuits insolites',
    icon: Moon,
    image: 'https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=insolite',
  },
  {
    label: 'Campings',
    icon: Tent,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=camping',
  },
  {
    label: 'Villages',
    icon: MapPin,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80&auto=format&fit=crop',
    href: '/listings?type=village',
  },
];


function serializeListing(l) {
  return {
    ...l,
    _id: l._id.toString(),
    owner: l.owner ? { ...l.owner, _id: l.owner._id.toString() } : null,
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

export async function getServerSideProps() {
  try {
    await dbConnect();

    const [featuredRaw, latestRaw, typeCounts, popularCities] = await Promise.all([
      // Vedettes
      Listing.find({ isFeatured: true })
        .sort({ averageRating: -1, createdAt: -1 })
        .limit(6)
        .populate('owner', 'name')
        .lean(),

      // Dernieres annonces
      Listing.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('owner', 'name')
        .lean(),

      // Compteurs par type
      Listing.aggregate([
        { $match: {} },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),

      // Villes populaires (top 8 par nombre d'annonces)
      Listing.aggregate([
        { $match: { 'location.city': { $exists: true, $ne: '' } } },
        { $group: { _id: '$location.city', count: { $sum: 1 }, region: { $first: '$location.region' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const featured = featuredRaw.map(serializeListing);
    const latest = latestRaw.map(serializeListing);

    // Construire les compteurs par type : { villa: 5, apartment: 12, ... }
    const typeCountMap = {};
    typeCounts.forEach((t) => { typeCountMap[t._id] = t.count; });

    // Villes populaires
    const cities = popularCities.map((c) => ({
      name: c._id,
      region: c.region || 'France',
      count: c.count,
    }));

    return {
      props: {
        featured,
        latest,
        typeCounts: typeCountMap,
        cities,
      },
    };
  } catch (error) {
    console.error('[HOME] Erreur fetch:', error.message);
    return {
      props: {
        featured: [],
        latest: [],
        typeCounts: {},
        cities: [],
      },
    };
  }
}

export default function HomePage({ featured, latest, typeCounts, cities }) {
  // Toutes les categories avec compteurs reels, filtrer celles sans annonces sauf les principales
  const MAIN_TYPES = ['gite', 'apartment', 'villa', 'chalet', 'chambre_hotes', 'house'];
  const categories = PROPERTY_TYPES
    .filter((key) => typeCounts[key] > 0 || MAIN_TYPES.includes(key))
    .map((key) => ({
      key,
      label: getLabel(PROPERTY_TYPE_LABELS, key),
      icon: CATEGORY_ICONS[key] || Building2,
      count: typeCounts[key] || 0,
    }));

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80&auto=format&fit=crop"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-accent/[0.08] blur-[120px]" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center justify-center px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Locations d&apos;exception
              </span>
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Trouvez le sejour{' '}
              <span className="text-gradient">parfait</span>
              <br className="hidden sm:block" />
              {' '}pour chaque instant
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              Gites, appartements, villas &mdash; explorez notre selection de logements
              d&apos;exception et reservez en toute serenite.
            </p>
          </div>

          <div className="animate-fade-in-up animation-delay-300 mx-auto mt-12 w-full max-w-5xl">
            <HeroSearch cities={cities} />
          </div>
        </div>
      </section>

      {/* ─── TYPES DE BIENS ─── */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-center justify-between px-5 sm:px-6">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Explorer
            </h2>
            <Link
              href="/listings"
              className="flex items-center gap-1 text-xs font-semibold text-accent"
            >
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />

            <div className="flex gap-2.5 overflow-x-auto scroll-smooth px-5 pb-1 sm:px-6 scrollbar-none">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.key}
                    href={`/listings?type=${cat.key}`}
                    className="group flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 transition-all duration-200 hover:border-accent/50 hover:bg-accent/5 hover:text-accent active:scale-95"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-accent" />
                    <span className="whitespace-nowrap text-sm font-medium text-foreground group-hover:text-accent">{cat.label}</span>
                    {cat.count > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {cat.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS POPULAIRES ─── */}
      {cities.length > 0 && (
        <section className="pb-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
                  Ou partir ?
                </p>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Destinations populaires
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cities.map((city) => (
                <Link
                  key={city.name}
                  href={`/listings?city=${encodeURIComponent(city.name)}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent">
                      {city.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {city.count} annonce{city.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── LOGEMENTS EN VEDETTE ─── */}
      {featured.length > 0 && (
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
                  Selection du moment
                </p>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Logements en vedette
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Des adresses d&apos;exception choisies pour vous.
                </p>
              </div>
              <Link
                href="/listings"
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-accent/40 hover:text-accent"
              >
                Voir tout
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── DERNIERES ANNONCES ─── */}
      {latest.length > 0 && (
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
                  Fraichement ajoutees
                </p>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Dernieres annonces
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Les toutes dernieres locations ajoutees sur Restate.
                </p>
              </div>
              <Link
                href="/listings?sort=newest"
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-accent/40 hover:text-accent"
              >
                Voir plus
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latest.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── TOUS LES TYPES DE LOGEMENT ─── */}
      <section className="pb-24 pt-4">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <h2 className="mb-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
            Tous les types de logement
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {LODGING_TYPES.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.label}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/20" />
                    <div className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm">
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>

                  <div className="px-0.5 pt-2 pb-1">
                    <p className="text-sm font-semibold leading-tight text-foreground transition-colors duration-200 group-hover:text-accent">
                      {item.label}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
