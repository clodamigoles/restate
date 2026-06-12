import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import ListingForm from '@/components/listings/ListingForm';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  ClipboardPaste, Loader2, CheckCircle2, RefreshCw,
  MessageSquare, ArrowLeft, Info, ExternalLink,
} from 'lucide-react';

const BLOCKED_SITES = [
  { name: 'Abritel / VRBO', icon: '🏠', color: 'text-orange-600' },
  { name: 'Airbnb', icon: '🌐', color: 'text-pink-600' },
  { name: 'Booking.com', icon: '🔵', color: 'text-blue-600' },
];

export default function ImportPastePage() {
  const router = useRouter();
  const [pastedText, setPastedText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [extractedReviews, setExtractedReviews] = useState([]);
  const [formKey, setFormKey] = useState(0);

  async function handleAnalyze(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setExtracted(null);
    setExtractedReviews([]);

    try {
      const res = await fetch('/api/paste-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: pastedText, url: sourceUrl || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExtracted(data.data);
      setExtractedReviews(data.reviews || []);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAfterSave(listingId) {
    if (extractedReviews.length > 0 && sourceUrl) {
      try {
        await fetch(`/api/listings/${listingId}/reviews/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reviews: extractedReviews, source: sourceUrl }),
        });
      } catch {
        // non bloquant
      }
    }
    router.push('/dlt/listings');
  }

  function handleReset() {
    setExtracted(null);
    setExtractedReviews([]);
    setPastedText('');
    setSourceUrl('');
    setError('');
  }

  return (
    <AdminLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dlt' },
        { label: 'Annonces', href: '/dlt/listings' },
        { label: 'Import manuel (sites bloquants)' },
      ]}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
            <ClipboardPaste className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">Import manuel — sites bloquants</h1>
              <Link
                href="/dlt/listings/import"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Retour à l'import automatique
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pour Abritel, Airbnb, Booking et autres sites qui bloquent l'accès automatique.
            </p>
          </div>
        </div>

        {/* Sites concernés */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 mb-5">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                Cette page est pour les sites qui bloquent l'import automatique :
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {BLOCKED_SITES.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
                  >
                    {s.icon} {s.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
                Comment faire :
              </p>
              <ol className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5 list-decimal list-inside">
                <li>Ouvrez l'annonce dans votre navigateur</li>
                <li>Appuyez sur <kbd className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono text-[11px]">Ctrl+A</kbd> pour tout sélectionner puis <kbd className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono text-[11px]">Ctrl+C</kbd> pour copier</li>
                <li>Collez dans le champ ci-dessous et cliquez <strong>Analyser</strong></li>
              </ol>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        {!extracted && (
          <form onSubmit={handleAnalyze}>
            <div className="rounded-xl border bg-card p-5 space-y-4">

              {/* URL optionnelle */}
              <div className="space-y-1.5">
                <Label htmlFor="source-url" className="flex items-center gap-1.5">
                  URL de l'annonce
                  <span className="text-xs font-normal text-muted-foreground">(optionnel — aide l'IA à mieux contextualiser)</span>
                </Label>
                <div className="flex gap-2">
                  <input
                    id="source-url"
                    type="url"
                    placeholder="https://www.abritel.fr/location-vacances/p123456"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 shrink-0 hover:bg-accent transition-colors"
                      title="Ouvrir l'annonce"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>

              {/* Textarea texte collé */}
              <div className="space-y-1.5">
                <Label htmlFor="pasted-text">
                  Texte de la page
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    ({pastedText.length.toLocaleString('fr')} caractères
                    {pastedText.length > 14000 && (
                      <span className="text-amber-600 dark:text-amber-400"> — seuls les 14 000 premiers seront analysés</span>
                    )})
                  </span>
                </Label>
                <textarea
                  id="pasted-text"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="Collez ici le texte copié depuis la page de l'annonce (Ctrl+A puis Ctrl+C dans votre navigateur)…"
                  rows={10}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  Plus vous collez de texte, meilleur sera le résultat.
                </p>
                <Button type="submit" disabled={loading || pastedText.trim().length < 50}>
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyse en cours…</>
                    : <><ClipboardPaste className="mr-2 h-4 w-4" />Analyser</>
                  }
                </Button>
              </div>

              {loading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse IA en cours… (10–20 secondes)
                </p>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Résultats */}
        {extracted && (
          <div className="mt-6 space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-5 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Données extraites — vérifiez puis enregistrez l'annonce.
                </p>
                {extractedReviews.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {extractedReviews.length} avis trouvé{extractedReviews.length > 1 ? 's' : ''} — ils seront importés automatiquement à la création.
                  </p>
                )}
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Les photos ne sont pas importées automatiquement — ajoutez-les manuellement dans le formulaire.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-emerald-700 underline hover:no-underline dark:text-emerald-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Recommencer avec un autre texte
                </button>
              </div>
            </div>

            <ListingForm
              key={formKey}
              initial={extracted}
              onAfterSave={handleAfterSave}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
