import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import ListingForm from '@/components/listings/ListingForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Wand2, Loader2, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react';

export default function ImportListingPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [extractedReviews, setExtractedReviews] = useState([]);

  async function handleAnalyze(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setExtracted(null);
    setExtractedReviews([]);

    try {
      const res = await fetch('/api/scrape-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExtracted(data.data);
      setExtractedReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Appelé par ListingForm après création réussie
  async function handleAfterSave(listingId) {
    if (extractedReviews.length > 0) {
      try {
        await fetch(`/api/listings/${listingId}/reviews/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reviews: extractedReviews, source: url }),
        });
      } catch {
        // Non bloquant : l'annonce est déjà créée
      }
    }
    router.push('/dlt/listings');
  }

  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Annonces', href: '/dlt/listings' },
        { label: 'Importer via IA' },
      ]}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Importer une annonce via IA</h1>
            <p className="text-sm text-muted-foreground">
              Collez l'URL d'une annonce — l'IA extrait et structure les données automatiquement.
            </p>
          </div>
        </div>

        {/* Saisie URL */}
        <form onSubmit={handleAnalyze}>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-url">URL de l'annonce à analyser</Label>
              <div className="flex gap-3">
                <Input
                  id="import-url"
                  type="url"
                  placeholder="https://www.gites.fr/d/52550413..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !url}>
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyse…</>
                    : <><Wand2 className="mr-2 h-4 w-4" />Analyser</>
                  }
                </Button>
              </div>
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Récupération + analyse IA en cours… (10–25 secondes)
              </p>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Formulaire pré-rempli */}
        {extracted && (
          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-5 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Données extraites — vérifiez, uploadez les photos, puis créez l'annonce.
                </p>
                {extractedReviews.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {extractedReviews.length} avis trouvé{extractedReviews.length > 1 ? 's' : ''} — ils seront importés automatiquement à la création.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => { setExtracted(null); setExtractedReviews([]); }}
                  className="flex items-center gap-1 text-xs text-emerald-700 underline hover:no-underline dark:text-emerald-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Analyser une autre URL
                </button>
              </div>
            </div>

            <ListingForm initial={extracted} onAfterSave={handleAfterSave} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
