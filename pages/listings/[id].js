import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useRef, cloneElement } from 'react';
import { useRouter } from 'next/router';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import ListingGallery from '@/components/listings/ListingGallery';
import ReviewsModal from '@/components/listings/ReviewsModal';
import AvailabilityCalendar from '@/components/bookings/AvailabilityCalendar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { formatPrice, PROPERTY_TYPE_LABELS, AMENITY_LABELS, getLabel } from '@/lib/constants';
import { getLocalizedField } from '@/lib/i18n';
import {
  MapPin, Users, BedDouble, Bath, Clock, Wifi, Star,
  CheckCircle2, ChevronRight, CalendarDays,
  UtensilsCrossed, CarFront, Tv, Snowflake, Flame,
  Laptop, WashingMachine, Wind, Refrigerator, Microwave,
  Beef, Coffee, Waves, Droplets, TreePine, Fence,
  Bike, Dumbbell, Eye, Mountain, Accessibility,
  ArrowUpDown, Zap, Baby, Armchair, FerrisWheel,
  Heart, ShieldCheck, PawPrint, Ban, Cigarette, CircleOff,
  Ruler, Layers, DoorClosed, Award, Leaf, Activity, Tag,
  User2, Globe, Shield, Banknote, Receipt, Info,
} from 'lucide-react';

const AMENITY_ICONS = {
  wifi: Wifi,
  kitchen: UtensilsCrossed,
  parking: CarFront,
  tv: Tv,
  air_conditioning: Snowflake,
  heating: Flame,
  workspace: Laptop,
  dishwasher: WashingMachine,
  fridge: Refrigerator,
  microwave: Microwave,
  bbq: Beef,
  breakfast: Coffee,
  pool: Waves,
  private_pool: Droplets,
  garden: TreePine,
  balcony: Wind,
  fenced: Fence,
  bike_rental: Bike,
  hot_tub: Droplets,
  sauna: Flame,
  gym: Dumbbell,
  fireplace: Flame,
  washer: WashingMachine,
  dryer: Wind,
  sea_view: Eye,
  lake_view: Eye,
  mountain_view: Mountain,
  wheelchair_accessible: Accessibility,
  elevator: ArrowUpDown,
  ev_charger: Zap,
  cot: Baby,
  high_chair: Armchair,
  playground: FerrisWheel,
  family_friendly: Heart,
  childcare: ShieldCheck,
  pets_allowed: PawPrint,
  no_pets: Ban,
  smoking_allowed: Cigarette,
  non_smoking: CircleOff,
};

export default function ListingDetailPage({ listing, reviews = [], subRatings = {} }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [booking, setBooking] = useState(false);
  const [guestStep, setGuestStep] = useState('idle'); // 'idle' | 'email' | 'choice' | 'register'
  const [guestEmail, setGuestEmail] = useState('');
  const [guestForm, setGuestForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarRange, setCalendarRange] = useState({ from: undefined, to: undefined });
  const [showReviews, setShowReviews] = useState(false);

  // Plages bloquées localement après une réservation réussie (mise à jour optimiste)
  const [extraDisabledRanges, setExtraDisabledRanges] = useState([]);

  const calendarRef = useRef(null);

  const pendingBookRef = useRef(false);

  useEffect(() => {
    if (session && pendingBookRef.current) {
      pendingBookRef.current = false;
      setGuestStep('idle');
      setGuestEmail('');
      setGuestForm({ name: '', password: '', confirmPassword: '' });
      setGuestError('');
      submitBooking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Fermer le calendrier en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  if (!listing) return null;

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 0;
  const subtotal = nights * listing.pricePerNight;
  const cleaning = listing.cleaningFee || 0;
  const total = subtotal + cleaning;

  function formatDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function handleCalendarSelect(from, to) {
    setCheckIn(from.toISOString().split('T')[0]);
    setCheckOut(to.toISOString().split('T')[0]);
    setBookingError('');
    setShowCalendar(false);
  }

  function handleOpenCalendar() {
    // Pré-remplir le calendrier avec les dates existantes si elles existent
    const prevFrom = checkIn ? new Date(checkIn) : undefined;
    const prevTo   = checkOut ? new Date(checkOut) : undefined;
    setCalendarRange({ from: prevFrom, to: prevTo });
    setBookingError('');
    setGuestStep('idle');
    setGuestError('');
    setShowCalendar(true);
  }

  async function submitBooking() {
    setBookingError('');
    if (guests > listing.capacity) {
      return setBookingError(`Capacité maximale : ${listing.capacity} personnes`);
    }
    setBooking(true);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing._id, checkIn, checkOut, guests }),
    });
    const data = await res.json();
    setBooking(false);
    if (!data.success) return setBookingError(data.error);

    // Mise à jour optimiste du calendrier avant la redirection
    setExtraDisabledRanges((prev) => [
      ...prev,
      { from: new Date(checkIn), to: new Date(checkOut) },
    ]);

    router.push(`/bookings/${data.data._id}`);
  }

  function handleBook(e) {
    e.preventDefault();
    if (!checkIn || !checkOut) return setBookingError('Sélectionnez vos dates dans le calendrier');
    if (!session) {
      if (guestStep === 'idle') {
        pendingBookRef.current = true;
        setGuestStep('email');
      } else if (guestStep === 'email') {
        handleGuestContinue();
      } else if (guestStep === 'register') {
        handleGuestRegister();
      }
      return;
    }
    submitBooking();
  }

  async function handleGuestContinue() {
    if (!guestEmail) return;
    setGuestError('');
    setGuestLoading(true);
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(guestEmail)}`);
      const data = await res.json();
      if (!data.success) { setGuestError('Erreur lors de la vérification'); return; }
      if (data.exists) {
        const result = await signIn('credentials', { redirect: false, email: guestEmail, skipPassword: 'true' });
        if (result?.error) { setGuestError('Erreur de connexion'); return; }
        // useEffect sur session déclenche submitBooking automatiquement
      } else {
        setGuestStep('choice');
      }
    } catch {
      setGuestError('Une erreur est survenue');
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleGuestLater() {
    setGuestError('');
    setGuestLoading(true);
    try {
      const tempPassword =
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10) +
        'Aa1!';
      const guestName = guestEmail.split('@')[0];
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, email: guestEmail, password: tempPassword }),
      });
      const data = await res.json();
      if (!data.success) { setGuestError(data.error); return; }
      const result = await signIn('credentials', { redirect: false, email: guestEmail, skipPassword: 'true' });
      if (result?.error) { setGuestError('Erreur de connexion'); return; }
      // useEffect sur session déclenche submitBooking
    } catch {
      setGuestError('Une erreur est survenue');
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleGuestRegister() {
    if (!guestForm.name || !guestForm.password) return;
    if (guestForm.password !== guestForm.confirmPassword) {
      return setGuestError('Les mots de passe ne correspondent pas');
    }
    setGuestError('');
    setGuestLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestForm.name, email: guestEmail, password: guestForm.password }),
      });
      const data = await res.json();
      if (!data.success) { setGuestError(data.error); return; }
      const result = await signIn('credentials', { redirect: false, email: guestEmail, password: guestForm.password });
      if (result?.error) { setGuestError('Connexion automatique échouée'); return; }
      // useEffect sur session déclenche submitBooking
    } catch {
      setGuestError('Une erreur est survenue');
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{getLocalizedField(listing.title)} — Maxo Destinations</title>
        <meta name="description" content={getLocalizedField(listing.description)?.slice(0, 155)} />
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Fil d'ariane */}
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/listings" className="hover:text-foreground">Annonces</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{getLocalizedField(listing.title)}</span>
        </nav>

        {/* Titre */}
        <h1 className="text-2xl font-bold sm:text-3xl">{getLocalizedField(listing.title)}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {listing.averageRating > 0 && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {listing.averageRating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({listing.reviewCount} avis)</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {listing.location.city}{listing.location.region && `, ${listing.location.region}`}
          </span>
          <span>{getLabel(PROPERTY_TYPE_LABELS, listing.type)}</span>
          {listing.label && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Award className="h-3.5 w-3.5" />
              {listing.label}
              {listing.stars ? ' ' + '★'.repeat(listing.stars) : ''}
            </span>
          )}
          {listing.instantBooking && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Zap className="h-3 w-3" />
              Réservation instantanée
            </span>
          )}
        </div>

        {/* Galerie */}
        <div className="mt-6">
          <ListingGallery images={listing.images} title={getLocalizedField(listing.title)} />
        </div>

        {/* Corps */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Infos principales */}
          <div className="space-y-8 lg:col-span-2">
            {/* Caractéristiques */}
            <div className="flex flex-wrap gap-3 border-b pb-6">
              <Spec icon={<Users />} label={`${listing.capacity} voyageurs`} />
              <Spec icon={<BedDouble />} label={`${listing.bedrooms} chambre${listing.bedrooms > 1 ? 's' : ''}`} />
              <Spec icon={<Bath />} label={`${listing.bathrooms} sdb`} />
              {listing.toilets > 0 && (
                <Spec icon={<DoorClosed />} label={`${listing.toilets} WC`} />
              )}
              {listing.surface > 0 && (
                <Spec icon={<Ruler />} label={`${listing.surface} m²`} />
              )}
              {listing.floors > 0 && (
                <Spec icon={<Layers />} label={`${listing.floors} niveau${listing.floors > 1 ? 'x' : ''}`} />
              )}
              <Spec icon={<Clock />} label={`Arrivée ${listing.checkInTime}`} />
              <Spec icon={<Clock />} label={`Départ ${listing.checkOutTime}`} />
              {listing.minNights > 1 && (
                <Spec icon={<CalendarDays />} label={`${listing.minNights} nuits min.`} />
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {getLocalizedField(listing.description)}
              </p>
            </div>

            {/* Équipements */}
            {listing.amenities?.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Équipements</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a];
                    return (
                      <div key={a} className="flex items-center gap-2.5 text-sm">
                        {Icon
                          ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />}
                        {getLabel(AMENITY_LABELS, a)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thèmes, activités, environnement */}
            {(listing.environment?.length > 0 || listing.activities?.length > 0 || listing.themes?.length > 0) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Ambiance & activités</h2>
                <div className="mt-4 space-y-4">
                  {listing.environment?.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Leaf className="h-4 w-4" /> Environnement
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {listing.environment.map((e) => (
                          <span key={e} className="rounded-full border bg-muted/50 px-3 py-1 text-sm capitalize">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.activities?.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Activity className="h-4 w-4" /> Activités à proximité
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {listing.activities.map((a) => (
                          <span key={a} className="rounded-full border bg-muted/50 px-3 py-1 text-sm capitalize">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.themes?.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-4 w-4" /> Idéal pour
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {listing.themes.map((t) => (
                          <span key={t} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary capitalize">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Règles */}
            {getLocalizedField(listing.rules) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Règles de la maison</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {getLocalizedField(listing.rules)}
                </p>
              </div>
            )}

            {/* Conditions (annulation, caution, taxe séjour) */}
            {(listing.cancellationPolicy || listing.deposit > 0 || listing.taxeSejour > 0) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Conditions</h2>
                <div className="mt-3 space-y-3">
                  {listing.cancellationPolicy && (
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Politique d'annulation</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {listing.cancellationPolicy === 'flexible' && 'Flexible — remboursement complet jusqu\'à 24h avant'}
                          {listing.cancellationPolicy === 'moderate' && 'Modérée — remboursement complet jusqu\'à 5 jours avant'}
                          {listing.cancellationPolicy === 'strict' && 'Stricte — remboursement 50% jusqu\'à 7 jours avant'}
                          {listing.cancellationPolicy === 'non_refundable' && 'Non remboursable'}
                          {!['flexible','moderate','strict','non_refundable'].includes(listing.cancellationPolicy) && listing.cancellationPolicy}
                        </p>
                      </div>
                    </div>
                  )}
                  {listing.deposit > 0 && (
                    <div className="flex items-center gap-3">
                      <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-sm">
                        <span className="font-medium">Caution :</span>{' '}
                        <span className="text-muted-foreground">{formatPrice(listing.deposit)}</span>
                      </p>
                    </div>
                  )}
                  {listing.taxeSejour > 0 && (
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-sm">
                        <span className="font-medium">Taxe de séjour :</span>{' '}
                        <span className="text-muted-foreground">{formatPrice(listing.taxeSejour)} / personne / nuit</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hébergeur */}
            {listing.host?.name && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">L'hébergeur</h2>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <User2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{listing.host.name}</p>
                    {listing.host.languages?.length > 0 && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        {listing.host.languages.join(', ').toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bon à savoir (extras) */}
            {(() => {
              const ex = listing.extras || {};
              const items = [
                ex.heatingType && { icon: <Flame className="h-4 w-4 shrink-0 text-muted-foreground" />, label: 'Chauffage', value: ex.heatingType },
                ex.architectureStyle && { icon: <Info className="h-4 w-4 shrink-0 text-muted-foreground" />, label: 'Style', value: ex.architectureStyle },
                ex.orientation && { icon: <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />, label: 'Orientation', value: ex.orientation },
                ex.gardenSurface && { icon: <Leaf className="h-4 w-4 shrink-0 text-muted-foreground" />, label: 'Jardin / terrasse', value: `${ex.gardenSurface} m²` },
                ex.parkingDetails && { icon: <CarFront className="h-4 w-4 shrink-0 text-muted-foreground" />, label: 'Parking', value: ex.parkingDetails },
                ex.internetDetails && { icon: <Wifi className="h-4 w-4 shrink-0 text-muted-foreground" />, label: 'Internet', value: ex.internetDetails },
              ].filter(Boolean);
              const services = ex.includedServices?.length > 0 ? ex.includedServices : null;
              const attractions = ex.nearbyAttractions?.length > 0 ? ex.nearbyAttractions.slice(0, 4) : null;
              if (!items.length && !services && !attractions) return null;
              return (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold">Bon à savoir</h2>
                  <div className="mt-3 space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        {item.icon}
                        <span className="font-medium">{item.label} :</span>
                        <span className="text-muted-foreground capitalize">{item.value}</span>
                      </div>
                    ))}
                    {services && (
                      <div className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <div>
                          <span className="font-medium">Services inclus</span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {services.map((s, i) => (
                              <span key={i} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 capitalize">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {attractions && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <span className="font-medium">À proximité</span>
                          <ul className="mt-1 space-y-0.5 text-muted-foreground">
                            {attractions.map((a, i) => (
                              <li key={i}>{a.name}{a.distance ? ` — ${a.distance}` : ''}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Avis */}
            {listing.reviewCount > 0 && (
              <div className="border-t pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    {listing.averageRating.toFixed(1)}
                    <span className="font-normal text-muted-foreground text-base">
                      · {listing.reviewCount} avis
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((r) => (
                    <div key={r._id} className="rounded-xl border bg-card p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {(r.user?.name || r.reviewerName || 'V').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {r.user?.name || r.reviewerName || 'Voyageur'}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600">
                              <ShieldCheck className="h-3 w-3" />
                              Voyageur vérifié
                            </p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {r.rating.toFixed(1)}
                        </span>
                      </div>
                      {r.title && (
                        <p className="mb-1 text-sm font-semibold">{r.title}</p>
                      )}
                      {r.comment && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => setShowReviews(true)}
                >
                  Voir les {listing.reviewCount} avis
                </Button>
              </div>
            )}

            {/* Localisation */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold">Localisation</h2>
              <p className="mt-2 text-muted-foreground">
                {listing.location.city}
                {listing.location.region && `, ${listing.location.region}`}
              </p>
              {listing.mapUrl && (
                <div className="mt-4 space-y-2">
                  <div className="overflow-hidden rounded-xl border">
                    <iframe
                      src={`${listing.mapUrl}&output=embed&z=14`}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Carte de localisation"
                    />
                  </div>
                  <a
                    href={listing.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Ouvrir dans Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire de réservation */}
          <div className="lg:col-span-1">
            <div id="booking-sidebar" className="sticky top-24 rounded-xl border p-6 shadow-sm">
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">{formatPrice(listing.pricePerNight)}</span>
                <span className="text-muted-foreground">/ nuit</span>
              </div>
              {(listing.taxeSejour > 0 || listing.deposit > 0) && (
                <div className="mb-4 space-y-1 text-xs text-muted-foreground">
                  {listing.taxeSejour > 0 && (
                    <p>+ Taxe de séjour : {formatPrice(listing.taxeSejour)} / pers / nuit</p>
                  )}
                  {listing.deposit > 0 && (
                    <p>Caution : {formatPrice(listing.deposit)}</p>
                  )}
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-3">
                {/* ── Sélecteur de dates ── */}
                <div ref={calendarRef}>

                  {/* Calendrier inline — visible pendant la sélection */}
                  {showCalendar ? (
                    <div className="space-y-2">
                      <AvailabilityCalendar
                        listingId={listing._id}
                        onRangeSelect={handleCalendarSelect}
                        numberOfMonths={1}
                        extraDisabledRanges={extraDisabledRanges}
                        range={calendarRange}
                        onRangeChange={setCalendarRange}
                        minNights={listing.minNights || 1}
                        maxNights={listing.maxNights || undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCalendar(false)}
                        className="w-full rounded-lg border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        Annuler
                      </button>
                    </div>

                  ) : checkIn && checkOut ? (
                    /* Résumé compact — dates sélectionnées */
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                      <div className="grid grid-cols-[1fr_48px_1fr]">

                        {/* Arrivée */}
                        <button
                          type="button"
                          onClick={handleOpenCalendar}
                          className="group flex flex-col gap-0.5 p-3 text-left transition-colors hover:bg-primary/5"
                        >
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">✓</span>
                            Arrivée
                          </span>
                          <span className="text-base font-bold text-foreground">
                            {new Date(checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(checkIn).toLocaleDateString('fr-FR', { year: 'numeric' })}
                          </span>
                        </button>

                        {/* Compteur de nuits */}
                        <div className="flex flex-col items-center justify-center border-x bg-muted/30">
                          <span className="text-lg font-extrabold leading-none text-primary">{nights}</span>
                          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            nuit{nights > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Départ */}
                        <button
                          type="button"
                          onClick={handleOpenCalendar}
                          className="group flex flex-col gap-0.5 p-3 text-left transition-colors hover:bg-primary/5"
                        >
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">✓</span>
                            Départ
                          </span>
                          <span className="text-base font-bold text-foreground">
                            {new Date(checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(checkOut).toLocaleDateString('fr-FR', { year: 'numeric' })}
                          </span>
                        </button>
                      </div>

                      {/* Modifier */}
                      <button
                        type="button"
                        onClick={handleOpenCalendar}
                        className="flex w-full items-center justify-center gap-1.5 border-t py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Modifier les dates
                      </button>
                    </div>

                  ) : (
                    /* Aucune date — CTA d'invite */
                    <button
                      type="button"
                      onClick={handleOpenCalendar}
                      className="group w-full rounded-xl border-2 border-dashed border-primary/30 px-4 py-6 text-center transition-all hover:border-primary/60 hover:bg-primary/5"
                    >
                      <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground transition-colors group-hover:text-primary" />
                      <p className="mt-2 text-sm font-semibold text-foreground">Choisissez vos dates</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Sélectionnez votre arrivée puis votre départ
                      </p>
                      {listing.minNights > 1 && (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                          Séjour minimum : {listing.minNights} nuits
                        </p>
                      )}
                    </button>
                  )}
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Voyageurs</p>
                  <input
                    type="number"
                    value={guests}
                    min={1}
                    max={listing.capacity}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="mt-1 w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>

                {bookingError && (
                  <p className="text-sm text-destructive">{bookingError}</p>
                )}

                {/* Flow inline pour les visiteurs non connectés */}
                {!session && guestStep !== 'idle' && (
                  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                    {guestStep === 'email' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="guest-email" className="text-sm font-medium">
                          Votre adresse email
                        </Label>
                        <Input
                          id="guest-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          autoFocus
                          required
                        />
                      </div>
                    )}

                    {guestStep === 'choice' && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Aucun compte trouvé pour{' '}
                          <span className="font-medium text-foreground">{guestEmail}</span>.
                          Comment souhaitez-vous continuer ?
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            onClick={() => setGuestStep('register')}
                            className="w-full"
                            disabled={guestLoading}
                          >
                            M&apos;inscrire maintenant
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGuestLater}
                            className="w-full"
                            disabled={guestLoading}
                          >
                            {guestLoading ? 'En cours…' : "Continuer, m'inscrire plus tard"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {guestStep === 'register' && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Créez votre compte{' '}
                          <span className="text-muted-foreground font-normal">({guestEmail})</span>
                        </p>
                        <Input
                          placeholder="Nom complet"
                          value={guestForm.name}
                          onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                          autoFocus
                          required
                        />
                        <Input
                          type="password"
                          placeholder="Mot de passe (min. 6 caractères)"
                          value={guestForm.password}
                          onChange={(e) => setGuestForm({ ...guestForm, password: e.target.value })}
                          minLength={6}
                          required
                        />
                        <Input
                          type="password"
                          placeholder="Confirmer le mot de passe"
                          value={guestForm.confirmPassword}
                          onChange={(e) => setGuestForm({ ...guestForm, confirmPassword: e.target.value })}
                          required
                        />
                      </div>
                    )}

                    {guestError && (
                      <p className="text-sm text-destructive">{guestError}</p>
                    )}
                  </div>
                )}

                {nights > 0 && (
                  <div className="space-y-2 border-t pt-3 text-sm">
                    <div className="flex justify-between">
                      <span>{formatPrice(listing.pricePerNight)} × {nights} nuit{nights > 1 ? 's' : ''}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {cleaning > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Frais de ménage</span>
                        <span>{formatPrice(cleaning)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                )}

                {guestStep === 'idle' || session ? (
                  <Button type="submit" className="w-full" disabled={booking || !checkIn || !checkOut}>
                    {booking ? 'Réservation en cours…' : 'Réserver'}
                  </Button>
                ) : guestStep === 'email' ? (
                  <Button type="submit" className="w-full" disabled={guestLoading || !guestEmail}>
                    {guestLoading ? 'Vérification…' : 'Continuer'}
                  </Button>
                ) : guestStep === 'register' ? (
                  <Button type="submit" className="w-full" disabled={guestLoading}>
                    {guestLoading ? 'Création en cours…' : 'Créer et réserver'}
                  </Button>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>

      <ReviewsModal
        open={showReviews}
        onClose={() => setShowReviews(false)}
        listingId={listing._id}
        averageRating={listing.averageRating}
        reviewCount={listing.reviewCount}
        subRatings={subRatings}
      />
    </>
  );
}

function Spec({ icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
      {cloneElement(icon, { className: 'h-3.5 w-3.5 shrink-0' })}
      <span>{label}</span>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  await dbConnect();
  await import('@/models/User');

  const { id } = params;
  const mongoose = (await import('mongoose')).default;
  const Review = (await import('@/models/Review')).default;

  const filter = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { slug: id }] }
    : { slug: id };

  const raw = await Listing.findOne(filter).populate('owner', 'name').lean();
  if (!raw) return { notFound: true };

  // Avis — 3 premiers + sous-notes agrégées
  const listingId = raw._id;
  const [previewReviews, subRatingsAgg] = await Promise.all([
    Review.find({ listing: listingId })
      .sort({ rating: -1, createdAt: -1 })
      .limit(3)
      .populate('user', 'name')
      .lean(),
    Review.aggregate([
      { $match: { listing: listingId } },
      {
        $group: {
          _id: null,
          cleanliness:   { $avg: '$subRatings.cleanliness' },
          communication: { $avg: '$subRatings.communication' },
          equipment:     { $avg: '$subRatings.equipment' },
          valueForMoney: { $avg: '$subRatings.valueForMoney' },
        },
      },
    ]),
  ]);

  const sr = subRatingsAgg[0] || {};
  const subRatings = {
    cleanliness:   sr.cleanliness   != null ? Math.round(sr.cleanliness   * 10) / 10 : null,
    communication: sr.communication != null ? Math.round(sr.communication * 10) / 10 : null,
    equipment:     sr.equipment     != null ? Math.round(sr.equipment     * 10) / 10 : null,
    valueForMoney: sr.valueForMoney != null ? Math.round(sr.valueForMoney * 10) / 10 : null,
  };

  const listing = {
    ...raw,
    _id: raw._id.toString(),
    owner: raw.owner ? { ...raw.owner, _id: raw.owner._id.toString() } : null,
    createdAt: raw.createdAt?.toISOString() || null,
    updatedAt: raw.updatedAt?.toISOString() || null,
    blockedDates: (raw.blockedDates || []).map((d) => ({
      start: d.start?.toISOString() || null,
      end: d.end?.toISOString() || null,
    })),
    seasonalPricing: (raw.seasonalPricing || []).map((s) => ({
      ...s,
      _id: s._id?.toString(),
      start: s.start?.toISOString() || null,
      end: s.end?.toISOString() || null,
    })),
    // Champs enrichis — explicitement sérialisés
    surface:            raw.surface             ?? null,
    toilets:            raw.toilets             ?? null,
    floors:             raw.floors              ?? null,
    label:              raw.label               ?? null,
    stars:              raw.stars               ?? null,
    themes:             raw.themes              || [],
    activities:         raw.activities          || [],
    environment:        raw.environment         || [],
    cancellationPolicy: raw.cancellationPolicy  ?? null,
    deposit:            raw.deposit             ?? null,
    taxeSejour:         raw.taxeSejour          ?? null,
    host:               raw.host ? { name: raw.host.name ?? null, languages: raw.host.languages || [] } : { name: null, languages: [] },
    extras:             raw.extras              || {},
    mapUrl:             raw.mapUrl              ?? null,
  };

  const reviews = previewReviews.map((r) => ({
    _id:          r._id.toString(),
    reviewerName: r.reviewerName || null,
    title:        r.title        || null,
    rating:       r.rating,
    comment:      r.comment      || null,
    isImported:   r.isImported   || false,
    subRatings:   r.subRatings   || null,
    user:         r.user ? { name: r.user.name } : null,
    createdAt:    r.createdAt?.toISOString() || null,
  }));

  return { props: { listing, reviews, subRatings } };
}
