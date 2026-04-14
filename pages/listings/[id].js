import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import ListingGallery from '@/components/listings/ListingGallery';
import AvailabilityCalendar from '@/components/bookings/AvailabilityCalendar';
import { Button } from '@/components/ui/Button';
import AuthModal from '@/components/auth/AuthModal';
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

export default function ListingDetailPage({ listing }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [booking, setBooking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarRange, setCalendarRange] = useState({ from: undefined, to: undefined });

  // Plages bloquées localement après une réservation réussie (mise à jour optimiste)
  const [extraDisabledRanges, setExtraDisabledRanges] = useState([]);

  const calendarRef = useRef(null);

  const pendingBookRef = useRef(false);

  useEffect(() => {
    if (session && pendingBookRef.current) {
      pendingBookRef.current = false;
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
    // Réinitialiser pour recommencer la sélection
    setCalendarRange({ from: undefined, to: undefined });
    setCheckIn('');
    setCheckOut('');
    setBookingError('');
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
      pendingBookRef.current = true;
      setShowAuthModal(true);
      return;
    }
    submitBooking();
  }

  return (
    <>
      <AuthModal
        open={showAuthModal}
        onOpenChange={(open) => {
          setShowAuthModal(open);
          if (!open) pendingBookRef.current = false;
        }}
        onSuccess={() => setShowAuthModal(false)}
        title="Connectez-vous pour finaliser votre réservation"
      />
      <Head>
        <title>{getLocalizedField(listing.title)} — Restate</title>
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
            {listing.location.city}, {listing.location.country}
          </span>
          <span>{getLabel(PROPERTY_TYPE_LABELS, listing.type)}</span>
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
              <Spec icon={<Clock />} label={`Arrivée ${listing.checkInTime}`} />
              <Spec icon={<Clock />} label={`Départ ${listing.checkOutTime}`} />
              {listing.instantBooking && (
                <Spec icon={<CheckCircle2 className="text-success" />} label="Réservation instantanée" />
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

            {/* Règles */}
            {getLocalizedField(listing.rules) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Règles de la maison</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {getLocalizedField(listing.rules)}
                </p>
              </div>
            )}

            {/* Localisation */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold">Localisation</h2>
              <p className="mt-2 text-muted-foreground">
                {listing.location.address}, {listing.location.zipCode} {listing.location.city}
                {listing.location.region && `, ${listing.location.region}`}
              </p>
            </div>
          </div>

          {/* Formulaire de réservation */}
          <div className="lg:col-span-1">
            <div id="booking-sidebar" className="sticky top-24 rounded-xl border p-6 shadow-sm">
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">{formatPrice(listing.pricePerNight)}</span>
                <span className="text-muted-foreground">/ nuit</span>
              </div>

              <form onSubmit={handleBook} className="space-y-3">
                {/* Dates — cliquables pour ouvrir le calendrier */}
                <div className="relative" ref={calendarRef}>
                  <div
                    className={`grid cursor-pointer grid-cols-2 overflow-hidden rounded-lg border transition-colors ${showCalendar ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary'}`}
                    onClick={handleOpenCalendar}
                  >
                    <div className={`border-r p-3 ${showCalendar && !calendarRange.from ? 'bg-primary/5' : ''}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arrivée</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {checkIn
                          ? new Date(checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                          : <span className="text-muted-foreground">Choisir</span>}
                      </p>
                    </div>
                    <div className={`p-3 ${showCalendar && calendarRange.from && !calendarRange.to ? 'bg-primary/5' : ''}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Départ</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {checkOut
                          ? new Date(checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                          : <span className="text-muted-foreground">Choisir</span>}
                      </p>
                    </div>
                  </div>

                  {showCalendar && (
                    <div className="absolute left-0 right-0 z-50 mt-2 lg:left-auto lg:right-0 lg:w-max">
                      <AvailabilityCalendar
                        listingId={listing._id}
                        onRangeSelect={handleCalendarSelect}
                        numberOfMonths={1}
                        extraDisabledRanges={extraDisabledRanges}
                        range={calendarRange}
                        onRangeChange={setCalendarRange}
                      />
                    </div>
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

                <Button type="submit" className="w-full" disabled={booking || !checkIn || !checkOut}>
                  {booking ? 'Réservation en cours…' : 'Réserver'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Spec({ icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-full border px-5 py-2 text-sm text-muted-foreground">
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  await dbConnect();
  await import('@/models/User');

  const { id } = params;
  const mongoose = (await import('mongoose')).default;

  const filter = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { slug: id }] }
    : { slug: id };

  const raw = await Listing.findOne(filter).populate('owner', 'name').lean();
  if (!raw) return { notFound: true };

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
  };

  return { props: { listing } };
}
