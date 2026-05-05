import Head from 'next/head';
import { useState } from 'react';
import useSWR from 'swr';
import BookingCard from '@/components/bookings/BookingCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const fetcher = (url) => fetch(url).then((r) => r.json());

const TABS = [
  { key: '', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'cancelled', label: 'Annulées' },
  { key: 'completed', label: 'Terminées' },
];

export default function BookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const url = `/api/bookings?page=${page}&limit=10${status ? `&status=${status}` : ''}`;
  const { data, isLoading } = useSWR(url, fetcher);

  const bookings = data?.data || [];
  const pagination = data?.pagination || {};

  function handleTab(key) {
    setStatus(key);
    setPage(1);
  }

  return (
    <>
      <Head><title>Mes réservations — Maxo Destinations</title></Head>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Mes réservations</h1>

        {/* Onglets */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                status === t.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {isLoading && (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted" />
            ))
          )}

          {!isLoading && bookings.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-lg font-medium">Aucune réservation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par explorer les annonces disponibles.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/listings">Voir les annonces</Link>
              </Button>
            </div>
          )}

          {bookings.map((b) => <BookingCard key={b._id} booking={b} />)}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
