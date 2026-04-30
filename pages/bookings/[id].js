import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BookingSummary from '@/components/bookings/BookingSummary';
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import PaymentMethodSelect from '@/components/payments/PaymentMethodSelect';
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge';
import BankTransferInfo from '@/components/payments/BankTransferInfo';
import { Button } from '@/components/ui/Button';
import { MapPin, ChevronRight, Clock, Download } from 'lucide-react';
import { usePayPalScriptReducer } from '@paypal/react-paypal-js';

// Chargé côté client uniquement (dépendance PayPal)
const PayPalButton = dynamic(() => import('@/components/payments/PayPalButton'), { ssr: false });
const QRCodeCanvas = dynamic(() => import('qrcode.react').then((m) => m.QRCodeCanvas), { ssr: false });

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data, mutate, isLoading } = useSWR(id ? `/api/bookings/${id}` : null, fetcher);
  const [, dispatch] = usePayPalScriptReducer();

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const booking = data?.data;

  // Récupère les détails bancaires en temps réel (polling 30s) dès qu'un virement est en cours
  const isPendingTransfer = booking?.paymentStatus === 'pending';
  const { data: paymentData, mutate: mutatePayment } = useSWR(
    (isPendingTransfer || bankDetails) && id ? `/api/bookings/${id}/payment` : null,
    fetcher,
    { refreshInterval: 30000 },
  );

  // paymentData (fraîchement récupéré) a priorité sur bankDetails (valeur de session initiale)
  const resolvedBankDetails = paymentData?.data?.bankDetails || bankDetails || null;
  const resolvedProofs = paymentData?.data?.proofs || [];

  async function handleCancel() {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    setCancelling(true);
    setCancelError('');
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', cancellationReason: 'Annulée par le client' }),
    });
    const d = await res.json();
    setCancelling(false);
    if (!d.success) return setCancelError(d.error);
    mutate();
  }

  async function initiateBankTransfer() {
    setBankLoading(true);
    setPaymentError('');
    const res = await fetch(`/api/bookings/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const d = await res.json();
    setBankLoading(false);
    if (!d.success) return setPaymentError(d.error);
    setBankDetails(d.data.bankDetails);
    mutate();
    mutatePayment();
  }

  function handleMethodChange(method) {
    setPaymentMethod(method);
    setPaymentError('');
    // Charger le SDK PayPal à la demande
    if (method === 'paypal') {
      dispatch({ type: 'setLoadingStatus', value: 'pending' });
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-medium">Réservation introuvable</p>
        <Button className="mt-4" asChild><Link href="/bookings">Mes réservations</Link></Button>
      </div>
    );
  }

  const listing = booking.listing;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const needsPayment = booking.status !== 'cancelled' && booking.paymentStatus === 'unpaid';
  const showBankTransferBlock =
    booking.status !== 'cancelled' && booking.paymentStatus === 'pending';

  return (
    <>
      <Head><title>Réservation — {listing?.title?.fr || listing?.title} — Restate</title></Head>
      <div className="mx-auto max-w-3xl px-4 py-8">

        {/* Fil d'ariane */}
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/bookings" className="hover:text-foreground">Mes réservations</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground line-clamp-1">{listing?.title?.fr || listing?.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Colonne principale */}
          <div className="lg:col-span-3 space-y-6">

            {/* En-tête logement */}
            <div className="flex gap-4 rounded-xl border p-4">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={listing?.images?.[0] || '/placeholder.jpg'}
                  alt={listing?.title?.fr || listing?.title || ''}
                  fill className="object-cover"
                />
              </div>
              <div>
                <h1 className="font-semibold leading-tight">{listing?.title?.fr || listing?.title}</h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />{listing?.location?.city}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <BookingStatusBadge status={booking.status} />
                  <PaymentStatusBadge status={booking.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arrivée</p>
                <p className="mt-1 font-semibold">{format(new Date(booking.checkIn), 'dd MMMM yyyy', { locale: fr })}</p>
                {listing?.checkInTime && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> À partir de {listing.checkInTime}
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Départ</p>
                <p className="mt-1 font-semibold">{format(new Date(booking.checkOut), 'dd MMMM yyyy', { locale: fr })}</p>
                {listing?.checkOutTime && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Avant {listing.checkOutTime}
                  </p>
                )}
              </div>
            </div>

            {/* Section paiement — choix du moyen */}
            {needsPayment && (
              <div className="rounded-xl border p-5 space-y-4">
                <h2 className="text-lg font-semibold">Paiement</h2>

                {paymentSuccess ? (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
                    <p className="font-medium text-success">Paiement confirmé !</p>
                    <p className="mt-1 text-muted-foreground">Votre réservation est confirmée.</p>
                  </div>
                ) : (
                  <>
                    <PaymentMethodSelect value={paymentMethod} onChange={handleMethodChange} />

                    {paymentError && (
                      <p className="text-sm text-destructive">{paymentError}</p>
                    )}

                    {paymentMethod === 'paypal' && (
                      <PayPalButton
                        bookingId={id}
                        onSuccess={() => { setPaymentSuccess(true); mutate(); }}
                        onError={(e) => setPaymentError(e)}
                      />
                    )}

                    {paymentMethod === 'bank_transfer' && (
                      <BankTransferInfo
                        bankDetails={bankDetails}
                        onInitiate={initiateBankTransfer}
                        loading={bankLoading}
                        bookingId={id}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Virement en attente — sélecteur toujours visible + contenu selon choix */}
            {showBankTransferBlock && (
              <div className="rounded-xl border p-5 space-y-4">
                <h2 className="text-lg font-semibold">Paiement</h2>

                {paymentSuccess ? (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
                    <p className="font-medium text-success">Paiement confirmé !</p>
                    <p className="mt-1 text-muted-foreground">Votre réservation est confirmée.</p>
                  </div>
                ) : (
                  <>
                    <PaymentMethodSelect
                      value={paymentMethod || 'bank_transfer'}
                      onChange={(m) => { setPaymentMethod(m); setPaymentError(''); }}
                    />

                    {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

                    {(!paymentMethod || paymentMethod === 'bank_transfer') && (
                      <BankTransferInfo
                        bankDetails={resolvedBankDetails}
                        onInitiate={null}
                        loading={false}
                        bookingId={id}
                        initialProofs={resolvedProofs}
                      />
                    )}

                    {paymentMethod === 'paypal' && (
                      <PayPalButton
                        bookingId={id}
                        onSuccess={() => { setPaymentSuccess(true); mutate(); }}
                        onError={(e) => setPaymentError(e)}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {booking.paymentStatus === 'paid' && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
                <p className="font-medium text-success">Paiement confirmé</p>
                <p className="mt-1 text-muted-foreground">Votre réservation est confirmée.</p>
              </div>
            )}

            {/* Annulation */}
            {canCancel && (
              <div className="rounded-lg border border-destructive/30 p-4">
                <h3 className="font-medium text-destructive">Annuler la réservation</h3>
                <p className="mt-1 text-sm text-muted-foreground">Cette action est irréversible.</p>
                {cancelError && <p className="mt-2 text-sm text-destructive">{cancelError}</p>}
                <Button variant="destructive" size="sm" className="mt-3" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Annulation...' : 'Annuler ma réservation'}
                </Button>
              </div>
            )}

            {booking.status === 'cancelled' && booking.cancellationReason && (
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <p className="font-medium">Motif d&apos;annulation</p>
                <p className="mt-1 text-muted-foreground">{booking.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-2">
            <BookingSummary booking={booking} />
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href={`/listings/${listing?.slug || listing?._id}`}>Voir l&apos;annonce</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
