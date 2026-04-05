import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminLayout from '@/components/layout/AdminLayout';
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge';
import { Button } from '@/components/ui/Button';
import { formatPrice, PAYMENT_METHOD_LABELS, getLabel } from '@/lib/constants';
import { CheckCircle2 } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_FILTERS = ['', 'pending', 'completed', 'failed', 'refunded'];
const METHOD_FILTERS = ['', 'paypal', 'bank_transfer'];

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

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
                    <td className="px-4 py-3 text-right">
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
