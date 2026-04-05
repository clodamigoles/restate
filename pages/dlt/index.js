import dynamic from 'next/dynamic';
import Link from 'next/link';
import useSWR from 'swr';
import AdminLayout from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BOOKING_STATUS_LABELS, getLabel, formatPrice } from '@/lib/constants';
import {
  Users, Building2, CalendarDays, CreditCard, Plus, ArrowRight, TrendingUp,
} from 'lucide-react';

const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'destructive',
  completed: 'muted',
};

export default function DashboardPage() {
  const { data, isLoading } = useSWR('/api/admin/stats', fetcher);
  const stats = data?.data;

  const STAT_CARDS = [
    { label: 'Utilisateurs', value: stats?.users ?? '—', icon: Users, href: '/dlt/users', color: 'text-blue-600 bg-blue-50' },
    { label: 'Annonces', value: stats?.listings ?? '—', icon: Building2, href: '/dlt/listings', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Reservations', value: stats?.bookings ?? '—', icon: CalendarDays, href: '/dlt/bookings', color: 'text-amber-600 bg-amber-50' },
    { label: 'Paiements', value: stats?.paymentsCompleted ?? '—', icon: CreditCard, href: '/dlt/payments', color: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="group">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="sm">
          <Link href="/dlt/listings/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvelle annonce
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dlt/payments">
            <CreditCard className="mr-1.5 h-4 w-4" />
            Paiements en attente
          </Link>
        </Button>
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {!isLoading && stats?.chartData && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}\u20ac`} />
                    <Tooltip formatter={(v) => [`${v} \u20ac`, 'Revenus']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Reservations mensuelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {!isLoading && stats?.chartData && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Reservations recentes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dlt/bookings">
              Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Logement</th>
                  <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Client</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
                ) : !stats?.recentBookings?.length ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Aucune reservation</td></tr>
                ) : (
                  stats.recentBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 max-w-[180px] truncate font-medium">
                        {b.listing?.title?.fr || b.listing?.title || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {b.user?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[b.status] || 'muted'}>
                          {getLabel(BOOKING_STATUS_LABELS, b.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
