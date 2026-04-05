import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import ListingGallery from '@/components/listings/ListingGallery';
import { Button } from '@/components/ui/Button';
import { formatPrice, PROPERTY_TYPE_LABELS, AMENITY_LABELS, getLabel } from '@/lib/constants';
import { getLocalizedField } from '@/lib/i18n';
import {
  MapPin, Users, BedDouble, Bath, Clock, Wifi, Star,
  CheckCircle2, ChevronRight,
} from 'lucide-react';

export default function ListingDetailPage({ listing }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [booking, setBooking] = useState(false);

  if (!listing) return null;

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 0;
  const subtotal = nights * listing.pricePerNight;
  const cleaning = listing.cleaningFee || 0;
  const total = subtotal + cleaning;

  async function handleBook(e) {
    e.preventDefault();
    setBookingError('');
    if (!session) return router.push('/auth/login?callbackUrl=' + router.asPath);
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
    router.push(`/bookings/${data.data._id}`);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
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
            <span className="flex items-center gap-1 text-foreground font-medium">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {listing.averageRating.toFixed(1)}
              <span className="text-muted-foreground font-normal">({listing.reviewCount} avis)</span>
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
          <div className="lg:col-span-2 space-y-8">
            {/* Caractéristiques */}
            <div className="flex flex-wrap gap-4 pb-6 border-b">
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
              <p className="mt-3 whitespace-pre-line text-muted-foreground leading-relaxed">
                {getLocalizedField(listing.description)}
              </p>
            </div>

            {/* Équipements */}
            {listing.amenities?.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Équipements</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      {getLabel(AMENITY_LABELS, a)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Règles */}
            {getLocalizedField(listing.rules) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold">Regles de la maison</h2>
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
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
            <div className="sticky top-24 rounded-xl border p-6 shadow-sm">
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">{formatPrice(listing.pricePerNight)}</span>
                <span className="text-muted-foreground">/ nuit</span>
              </div>

              <form onSubmit={handleBook} className="space-y-3">
                <div className="grid grid-cols-2 overflow-hidden rounded-lg border">
                  <div className="p-3 border-r">
                    <p className="text-xs font-semibold uppercase tracking-wide">Arrivée</p>
                    <input
                      type="date"
                      value={checkIn}
                      min={today}
                      onChange={(e) => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(''); }}
                      className="mt-1 w-full bg-transparent text-sm focus:outline-none"
                      required
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide">Départ</p>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn || today}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 w-full bg-transparent text-sm focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">Voyageurs</p>
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

                <Button type="submit" className="w-full" disabled={booking}>
                  {booking ? 'Réservation...' : session ? 'Réserver' : 'Se connecter pour réserver'}
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
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-4 w-4">{icon}</span>
      {label}
    </div>
  );
}

export async function getServerSideProps({ params }) {
  await dbConnect();

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
