import AdminLayout from '@/components/layout/AdminLayout';
import ListingForm from '@/components/listings/ListingForm';

export default function NewListingPage() {
  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Annonces', href: '/dlt/listings' },
        { label: 'Nouvelle annonce' },
      ]}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-bold mb-6">Nouvelle annonce</h1>
        <ListingForm />
      </div>
    </AdminLayout>
  );
}
