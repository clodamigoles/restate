import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, PROPERTY_TYPE_LABELS, getLabel } from '@/lib/constants';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ListingsPage() {
  const [page, setPage] = useState(1);
  const { data, mutate, isLoading } = useSWR(`/api/listings?page=${page}&limit=15`, fetcher);
  const listings = data?.data || [];
  const pagination = data?.pagination;

  const togglePublish = async (id, current) => {
    await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    });
    mutate();
  };

  const toggleFeatured = async (id, current) => {
    await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: !current }),
    });
    mutate();
  };

  const deleteListing = async (id) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <AdminLayout
      title="Annonces"
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Annonces' },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {pagination?.total ?? 0} annonce{(pagination?.total ?? 0) > 1 ? 's' : ''}
        </p>
        <Button asChild size="sm">
          <Link href="/dlt/listings/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvelle annonce
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Ville</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Prix/nuit</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : !listings.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune annonce</td></tr>
              ) : (
                listings.map((l) => (
                  <tr key={l._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          {l.images?.[0] && (
                            <Image src={l.images[0]} alt="" fill className="object-cover" sizes="56px" />
                          )}
                        </div>
                        <span className="font-medium truncate max-w-[200px]">
                          {l.title?.fr || l.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {getLabel(PROPERTY_TYPE_LABELS, l.type)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {l.location?.city}
                    </td>
                    <td className="px-4 py-3 font-medium hidden lg:table-cell">
                      {formatPrice(l.pricePerNight)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={l.isPublished ? 'success' : 'muted'}>
                          {l.isPublished ? 'Publie' : 'Brouillon'}
                        </Badge>
                        {l.isFeatured && (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePublish(l._id, l.isPublished)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title={l.isPublished ? 'Depublier' : 'Publier'}
                        >
                          {l.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => toggleFeatured(l._id, l.isFeatured)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-amber-500"
                          title={l.isFeatured ? 'Retirer vedette' : 'Mettre en vedette'}
                        >
                          {l.isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                        </button>
                        <Link
                          href={`/dlt/listings/${l._id}/edit`}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteListing(l._id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
