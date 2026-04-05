import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Trash2, ChevronDown } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const ROLES = ['', 'user', 'owner', 'admin'];
const ROLE_LABELS = { user: 'Utilisateur', owner: 'Proprietaire', admin: 'Admin' };
const ROLE_VARIANTS = { user: 'muted', owner: 'default', admin: 'destructive' };

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page, limit: 15 });
  if (search) params.set('search', search);
  if (roleFilter) params.set('role', roleFilter);

  const { data, mutate, isLoading } = useSWR(`/api/users?${params}`, fetcher);
  const users = data?.data || [];
  const pagination = data?.pagination;

  const updateRole = async (id, newRole) => {
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    mutate();
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Supprimer l'utilisateur "${name}" ? Cette action est irreversible.`)) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    mutate();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Utilisateurs' },
      ]}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {r === '' ? 'Tous' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Role</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Inscrit le</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : !users.length ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun utilisateur</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name || '—'}</p>
                          <p className="text-xs text-muted-foreground sm:hidden truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant={ROLE_VARIANTS[u.role] || 'muted'}>
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {u.createdAt ? format(new Date(u.createdAt), 'd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u._id, e.target.value)}
                            className="appearance-none rounded-md border bg-background pl-2.5 pr-7 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="owner">Proprietaire</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                        <button
                          onClick={() => deleteUser(u._id, u.name)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Supprimer"
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
