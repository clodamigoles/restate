import { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminLayout from '@/components/layout/AdminLayout';
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge';
import { Button } from '@/components/ui/Button';
import { formatPrice, PAYMENT_METHOD_LABELS, getLabel } from '@/lib/constants';
import { CheckCircle2, FileText, X, ExternalLink, Paperclip } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_FILTERS = ['', 'pending', 'completed', 'failed', 'refunded'];
const METHOD_FILTERS = ['', 'paypal', 'bank_transfer'];

function ReceiptsModal({ payment, onClose }) {
  const proofs = payment.transferProofs || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl rounded-xl border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Récipissés de virement</h2>
            <p className="mt-0.5 text-xs text-muted-foreground font-mono">
              Ref : {payment.transferReference || '—'} · {payment.user?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-5">
          {proofs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucun récipissé uploadé pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {proofs.map((url, i) => {
                const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('%2F') && url.toLowerCase().includes('pdf');
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col overflow-hidden rounded-lg border bg-muted transition-colors hover:border-primary"
                  >
                    {isPdf ? (
                      <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                        <FileText className="h-8 w-8" />
                        <span className="text-xs font-medium">PDF</span>
                      </div>
                    ) : (
                      <div className="relative h-32 w-full bg-muted">
                        <Image src={url} alt={`Récipissé ${i + 1}`} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t px-2 py-1.5">
                      <span className="text-xs text-muted-foreground">Fichier {i + 1}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const params = new URLSearchParams({ page, limit: 15 });
  if (statusFilter) params.set('status', statusFilter);
  if (methodFilter) params.set('method', methodFilter);

  const { data, mutate, isLoading } = useSWR(`/api/payments?${params}`, fetcher);
  const payments = data?.data || [];
  const pagination = data?.pagination;

  const validatePayment = async (id) => {
    if (!confirm('Valider ce virement bancaire ?')) return;
    await fetch(`/api/payments/${id}/validate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Valide par admin' }),
    });
    mutate();
  };

  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Paiements' },
      ]}
    >
      {selectedPayment && (
        <ReceiptsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s === '' ? 'Tous statuts' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {METHOD_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => { setMethodFilter(m); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                methodFilter === m
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {m === '' ? 'Tous modes' : getLabel(PAYMENT_METHOD_LABELS, m)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Methode</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Ref. virement</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : !payments.length ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun paiement</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{p.user?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.method === 'paypal' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                      }`}>
                        {getLabel(PAYMENT_METHOD_LABELS, p.method)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell font-mono">
                      {p.transferReference || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {p.createdAt ? format(new Date(p.createdAt), 'd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton récipissés — visible si virement bancaire */}
                        {p.method === 'bank_transfer' && (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              (p.transferProofs?.length || 0) > 0
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/70'
                            }`}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {(p.transferProofs?.length || 0) > 0
                              ? `${p.transferProofs.length} récipissé${p.transferProofs.length > 1 ? 's' : ''}`
                              : 'Aucun récipissé'}
                          </button>
                        )}

                        {/* Bouton valider */}
                        {p.method === 'bank_transfer' && p.status === 'pending' && (
                          <button
                            onClick={() => validatePayment(p._id)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/20 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Valider
                          </button>
                        )}

                        {p.validatedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            Valide le {format(new Date(p.validatedAt), 'd MMM', { locale: fr })}
                          </span>
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
