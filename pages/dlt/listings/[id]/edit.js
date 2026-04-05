import { useRouter } from 'next/router';
import useSWR from 'swr';
import AdminLayout from '@/components/layout/AdminLayout';
import ListingForm from '@/components/listings/ListingForm';
import { Loader2 } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function EditListingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data, isLoading } = useSWR(id ? `/api/listings/${id}` : null, fetcher);
  const listing = data?.data;

  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Annonces', href: '/dlt/listings' },
        { label: listing ? (listing.title?.fr || listing.title || 'Modifier') : 'Modifier' },
      ]}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-bold mb-6">Modifier l&apos;annonce</h1>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !listing ? (
          <p className="text-center text-muted-foreground py-20">Annonce introuvable</p>
        ) : (
          <ListingForm initial={listing} />
        )}
      </div>
    </AdminLayout>
  );
}
