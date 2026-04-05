import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminLayout from '@/components/layout/AdminLayout';
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import { Button } from '@/components/ui/Button';
import { formatPrice, BOOKING_STATUSES, BOOKING_STATUS_LABELS, getLabel } from '@/lib/constants';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_TABS = [
  { key: '', label: 'Toutes' },
  ...BOOKING_STATUSES.map((s) => ({ key: s, label: getLabel(BOOKING_STATUS_LABELS, s) })),
];

export default function BookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, mutate, isLoading } = useSWR(
    `/api/bookings?page=${page}&limit=15${status ? `&status=${status}` : ''}`,
    fetcher
  );
  const bookings = data?.data || [];
  const pagination = data?.pagination;

  const updateStatus = async (id, newStatus, reason) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, cancellationReason: reason }),
    });
    mutate();
  };

  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Reservations' },
      ]}
    >
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              status === tab.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Logement</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Dates</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : !bookings.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune reservation</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                      {b.listing?.title?.fr || b.listing?.title || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {b.user?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap text-xs">
                      {format(new Date(b.checkIn), 'd MMM', { locale: fr })}
                      {' — '}
                      {format(new Date(b.checkOut), 'd MMM yy', { locale: fr })}
                      <span className="ml-1 text-muted-foreground">({b.nights}n)</span>
                    </td>
                    <td className="px-4 py-3 font-semibold hidden lg:table-cell">
                      {formatPrice(b.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(b._id, 'confirmed')}
                              className="rounded-md p-1.5 text-success hover:bg-success/10"
                              title="Confirmer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateStatus(b._id, 'cancelled', 'Annule par admin')}
                              className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                              title="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => updateStatus(b._id, 'completed')}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Terminer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateStatus(b._id, 'cancelled', 'Annule par admin')}
                              className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                              title="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Precedent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
