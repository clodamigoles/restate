import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminLayout from '@/components/layout/AdminLayout';
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { formatPrice, BOOKING_STATUSES, BOOKING_STATUS_LABELS, getLabel } from '@/lib/constants';
import { CheckCircle2, XCircle, Eye, Mail } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_TABS = [
  { key: '', label: 'Toutes' },
  ...BOOKING_STATUSES.map((s) => ({ key: s, label: getLabel(BOOKING_STATUS_LABELS, s) })),
];

const STATUS_OPTIONS = BOOKING_STATUSES.map((s) => ({
  value: s,
  label: getLabel(BOOKING_STATUS_LABELS, s),
}));

function t(field) {
  if (!field) return '—';
  if (typeof field === 'string') return field;
  return field.fr || Object.values(field).find((v) => v) || '—';
}

function BookingDetailModal({ booking, open, onClose, onStatusChange, onRemind }) {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    if (booking) {
      setNewStatus(booking.status);
      setReason('');
      setReminderSent(false);
    }
  }, [booking?._id]);

  if (!booking) return null;

  const listing = booking.listing;
  const user = booking.user;
  const statusChanged = newStatus !== booking.status;

  const handleStatusSave = async () => {
    setSaving(true);
    await onStatusChange(booking._id, newStatus, reason);
    setSaving(false);
    onClose();
  };

  const handleRemind = async () => {
    setReminding(true);
    const ok = await onRemind(booking._id);
    setReminding(false);
    if (ok) setReminderSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la réservation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info principale */}
          <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logement</span>
              <span className="font-medium text-right max-w-[60%]">{t(listing?.title)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lieu</span>
              <span>{listing?.location?.city || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{user?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user?.email || '—'}</span>
            </div>
            {user?.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone</span>
                <span>{user.phone}</span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrivée</span>
              <span>{format(new Date(booking.checkIn), 'EEEE d MMMM yyyy', { locale: fr })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Départ</span>
              <span>{format(new Date(booking.checkOut), 'EEEE d MMMM yyyy', { locale: fr })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée</span>
              <span>{booking.nights} nuit{booking.nights > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voyageurs</span>
              <span>{booking.guests} personne{booking.guests > 1 ? 's' : ''}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix/nuit</span>
              <span>{formatPrice(booking.pricePerNight)}</span>
            </div>
            {booking.cleaningFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ménage</span>
                <span>{formatPrice(booking.cleaningFee)}</span>
              </div>
            )}
            {booking.serviceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de service</span>
                <span>{formatPrice(booking.serviceFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>

          {/* Statut paiement */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Paiement :</span>
            <BookingStatusBadge status={booking.paymentStatus} />
          </div>

          {/* Demande spéciale */}
          {booking.specialRequests && (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <p className="text-muted-foreground mb-1 font-medium">Demande spéciale</p>
              <p className="text-foreground">{booking.specialRequests}</p>
            </div>
          )}

          {/* Raison annulation */}
          {booking.cancellationReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive font-medium mb-1">Annulation</p>
              <p>{booking.cancellationReason}</p>
            </div>
          )}

          {/* Modifier le statut */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium">Modifier le statut</p>
            <select
              value={newStatus}
              onChange={(e) => { setNewStatus(e.target.value); setReason(''); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {statusChanged && newStatus === 'cancelled' && (
              <input
                type="text"
                placeholder="Raison de l'annulation (optionnel)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* Envoyer un rappel */}
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium mb-2">Email client</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemind}
              disabled={reminding || reminderSent}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {reminding ? 'Envoi...' : reminderSent ? 'Rappel envoyé ✓' : 'Envoyer un rappel'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button onClick={handleStatusSave} disabled={saving || !statusChanged}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const sendReminder = async (id) => {
    const res = await fetch(`/api/bookings/${id}/remind`, { method: 'POST' });
    return res.ok;
  };

  const openDetail = (booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setSelectedBooking(null), 200);
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
                      {t(b.listing?.title)}
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
                        {/* Voir les détails */}
                        <button
                          onClick={() => openDetail(b)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Actions rapides selon le statut */}
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
                              onClick={() => updateStatus(b._id, 'cancelled', 'Annulé par admin')}
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
                              title="Marquer comme terminée"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateStatus(b._id, 'cancelled', 'Annulé par admin')}
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

      <BookingDetailModal
        booking={selectedBooking}
        open={detailOpen}
        onClose={closeDetail}
        onStatusChange={updateStatus}
        onRemind={sendReminder}
      />
    </AdminLayout>
  );
}
