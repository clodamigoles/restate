import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import ListingForm from '@/components/listings/ListingForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Wand2, Loader2, CheckCircle2, RefreshCw, MessageSquare,
  Images, CheckSquare, Square, Upload,
} from 'lucide-react';

// ─── Image utilities (mirrors ListingForm) ───────────────────────────────────

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression échouée'));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(file.name)); };
    img.src = objectUrl;
  });
}

async function uploadSingle(file) {
  const fd = new FormData();
  fd.append('images', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data.url;
}

async function withConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const idx = next++;
      try { results[idx] = { status: 'fulfilled', value: await tasks[idx]() }; }
      catch (e) { results[idx] = { status: 'rejected', reason: e }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// Télécharge une image externe via le proxy serveur puis l'uploade sur notre CDN
async function importExternalImage(externalUrl) {
  const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(externalUrl)}`, {
    credentials: 'include',
  });
  if (!proxyRes.ok) throw new Error(`Proxy ${proxyRes.status}`);
  const blob = await proxyRes.blob();
  const filename = externalUrl.split('/').pop().split('?')[0] || 'image.jpg';
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  const compressed = await compressImage(file);
  return uploadSingle(compressed);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ImportListingPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [extractedReviews, setExtractedReviews] = useState([]);

  // Gallery image state
  const [galleryImages, setGalleryImages] = useState([]); // URLs from source page
  const [selectedImages, setSelectedImages] = useState(new Set()); // checked URLs
  const [importingImages, setImportingImages] = useState(false);
  const [importProgress, setImportProgress] = useState(null); // { total, done, errors }
  const [importedImageUrls, setImportedImageUrls] = useState([]); // uploaded CDN URLs
  const [formKey, setFormKey] = useState(0); // incremented to force ListingForm remount

  async function handleAnalyze(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setExtracted(null);
    setExtractedReviews([]);
    setGalleryImages([]);
    setSelectedImages(new Set());
    setImportedImageUrls([]);

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
      const imgs = data.galleryImages || [];
      setGalleryImages(imgs);
      setSelectedImages(new Set(imgs)); // tout sélectionné par défaut
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportImages() {
    const toImport = [...selectedImages];
    if (!toImport.length) return;

    setImportingImages(true);
    setImportProgress({ total: toImport.length, done: 0, errors: 0 });

    let done = 0, errors = 0;
    const uploaded = [];

    const tasks = toImport.map((imgUrl) => async () => {
      try {
        const cdnUrl = await importExternalImage(imgUrl);
        uploaded.push(cdnUrl);
      } catch {
        errors++;
      } finally {
        done++;
        setImportProgress({ total: toImport.length, done, errors });
      }
    });

    await withConcurrency(tasks, 3);

    setImportedImageUrls(uploaded);
    setFormKey((k) => k + 1); // remonte ListingForm avec les images pré-remplies
    setImportingImages(false);
    setImportProgress(null);
  }

  function toggleImage(imgUrl) {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(imgUrl)) next.delete(imgUrl);
      else next.add(imgUrl);
      return next;
    });
  }

  function selectAll() { setSelectedImages(new Set(galleryImages)); }
  function deselectAll() { setSelectedImages(new Set()); }

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
        // non bloquant
      }
    }
    router.push('/dlt/listings');
  }

  const initialWithImages = extracted
    ? { ...extracted, images: importedImageUrls }
    : null;

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

        {/* Résultats */}
        {extracted && (
          <div className="mt-8 space-y-6">
            {/* Bannière succès */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-5 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Données extraites — sélectionnez les photos de la galerie, puis créez l'annonce.
                </p>
                {extractedReviews.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {extractedReviews.length} avis trouvé{extractedReviews.length > 1 ? 's' : ''} — ils seront importés automatiquement à la création.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExtracted(null);
                    setExtractedReviews([]);
                    setGalleryImages([]);
                    setSelectedImages(new Set());
                    setImportedImageUrls([]);
                  }}
                  className="flex items-center gap-1 text-xs text-emerald-700 underline hover:no-underline dark:text-emerald-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Analyser une autre URL
                </button>
              </div>
            </div>

            {/* ── Sélecteur de photos galerie ── */}
            {galleryImages.length > 0 && (
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Images className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      Photos de la galerie source
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({galleryImages.length} trouvée{galleryImages.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      disabled={importingImages}
                      className="text-xs text-primary underline hover:no-underline disabled:opacity-50"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      disabled={importingImages}
                      className="text-xs text-primary underline hover:no-underline disabled:opacity-50"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                {/* Grille de miniatures */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {galleryImages.map((imgUrl) => {
                    const checked = selectedImages.has(imgUrl);
                    return (
                      <button
                        key={imgUrl}
                        type="button"
                        onClick={() => toggleImage(imgUrl)}
                        disabled={importingImages}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none disabled:opacity-60 ${
                          checked
                            ? 'border-primary ring-1 ring-primary'
                            : 'border-transparent opacity-60 hover:opacity-90'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className={`absolute top-1 right-1 rounded-sm ${checked ? 'text-primary' : 'text-white/70'}`}>
                          {checked
                            ? <CheckSquare className="h-4 w-4 drop-shadow" />
                            : <Square className="h-4 w-4 drop-shadow" />
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Barre d'action */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <Button
                    type="button"
                    onClick={handleImportImages}
                    disabled={selectedImages.size === 0 || importingImages}
                  >
                    {importingImages
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Import en cours…</>
                      : <><Upload className="mr-2 h-4 w-4" />Importer {selectedImages.size} photo{selectedImages.size > 1 ? 's' : ''} dans le formulaire</>
                    }
                  </Button>

                  {importProgress && (
                    <span className="text-xs text-muted-foreground">
                      {importProgress.done}/{importProgress.total}
                      {importProgress.errors > 0 && ` · ${importProgress.errors} erreur${importProgress.errors > 1 ? 's' : ''}`}
                    </span>
                  )}

                  {importedImageUrls.length > 0 && !importingImages && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {importedImageUrls.length} photo{importedImageUrls.length > 1 ? 's' : ''} ajoutée{importedImageUrls.length > 1 ? 's' : ''} au formulaire
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Formulaire pré-rempli */}
            <ListingForm
              key={formKey}
              initial={initialWithImages}
              onAfterSave={handleAfterSave}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
