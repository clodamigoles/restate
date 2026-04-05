import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CalendarDays, Settings, Home, Clock } from 'lucide-react';
import { BOOKING_STATUS_LABELS, formatPrice, getLabel } from '@/lib/constants';
import { format, isAfter, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'destructive',
  completed: 'muted',
};

function BookingRow({ booking }) {
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const upcoming = isAfter(checkIn, startOfDay(new Date()));

  return (
    <Link
      href={`/bookings/${booking._id}`}
      className="flex items-start gap-3 rounded-lg border bg-background p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {upcoming ? <Clock className="h-5 w-5 text-primary" /> : <Home className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{booking.listing?.title?.fr || booking.listing?.title || 'Annonce supprimee'}</p>
        <p className="text-sm text-muted-foreground">
          {format(checkIn, 'd MMM', { locale: fr })} → {format(checkOut, 'd MMM yyyy', { locale: fr })} · {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Badge variant={STATUS_VARIANT[booking.status] || 'muted'}>
          {getLabel(BOOKING_STATUS_LABELS, booking.status)}
        </Badge>
        <span className="text-sm font-medium">{formatPrice(booking.totalPrice)}</span>
      </div>
    </Link>
  );
}

export default function AccountPage() {
  const { data: session } = useSession();
  const { data: bookingsData } = useSWR('/api/bookings?limit=20', fetcher);

  const bookings = bookingsData?.data || [];
  const upcoming = bookings.filter(
    (b) => ['pending', 'confirmed'].includes(b.status) && isAfter(new Date(b.checkIn), startOfDay(new Date()))
  );
  const past = bookings.filter(
    (b) => b.status === 'completed' || (!isAfter(new Date(b.checkIn), startOfDay(new Date())) && b.status !== 'cancelled')
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mon espace</h1>
          <p className="text-muted-foreground">{session?.user?.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/account/settings">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{upcoming.length}</p>
            <p className="text-sm text-muted-foreground">À venir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{past.length}</p>
            <p className="text-sm text-muted-foreground">Séjours passés</p>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{bookings.length}</p>
            <p className="text-sm text-muted-foreground">Total réservations</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bookings */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Réservations à venir</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <p>Aucune réservation à venir</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/listings">Explorer les annonces</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => <BookingRow key={b._id} booking={b} />)}
          </div>
        )}
      </div>

      {/* Past bookings */}
      {past.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Séjours passés</h2>
          </div>
          <div className="space-y-3">
            {past.slice(0, 5).map((b) => <BookingRow key={b._id} booking={b} />)}
          </div>
          {past.length > 5 && (
            <Button variant="link" asChild className="mt-2">
              <Link href="/bookings">Voir tout l&apos;historique</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
