import { useState } from 'react';
import useSWR from 'swr';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/Dialog';
import { Star, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const fetcher = (url) => fetch(url).then((r) => r.json());

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Les plus pertinents' },
  { value: 'recent',   label: 'Le plus récent en premier' },
  { value: 'oldest',   label: 'Le plus ancien en premier' },
];

const SUB_LABELS = {
  cleanliness:   'Propreté',
  communication: 'Communication',
  equipment:     'Équipements',
  valueForMoney: 'Rapport qualité-prix',
};

function getRatingLabel(r) {
  if (r >= 9.5) return 'Exceptionnel';
  if (r >= 9)   return 'Fantastique';
  if (r >= 8)   return 'Excellent';
  if (r >= 7)   return 'Très bien';
  if (r >= 6)   return 'Bien';
  return 'Moyen';
}

function SubRatingBar({ label, value }) {
  if (value == null) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all"
          style={{ width: `${Math.round((value / 10) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const name = review.user?.name || review.reviewerName || 'Voyageur';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="border-b pb-5 last:border-b-0 last:pb-0">
      {review.title && (
        <p className="mb-1 font-semibold leading-snug">{review.title}</p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-medium">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          {review.rating.toFixed(1)}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {initial}
          </div>
          <span className="text-sm font-medium">{name}</span>
          <span className="flex items-center gap-0.5 text-xs text-emerald-600">
            <ShieldCheck className="h-3 w-3" />
            Vérifié
          </span>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
      )}
    </div>
  );
}

export default function ReviewsModal({ open, onClose, listingId, averageRating, reviewCount, subRatings }) {
  const [sort, setSort] = useState('relevant');
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading } = useSWR(
    open && listingId
      ? `/api/listings/${listingId}/reviews?sort=${sort}&page=${page}&limit=${limit}`
      : null,
    fetcher
  );

  function handleSort(s) {
    setSort(s);
    setPage(1);
  }

  const reviews = data?.data || [];
  const total = data?.pagination?.total ?? reviewCount;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const hasSubRatings = subRatings && Object.values(subRatings).some((v) => v != null);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 flex flex-col">

        {/* Header fixe */}
        <div className="border-b px-6 py-5">
          <DialogHeader>
            <DialogTitle className="sr-only">Avis voyageurs</DialogTitle>
          </DialogHeader>

          {/* Notice vérification */}
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Tous les avis proviennent exclusivement de voyageurs ayant effectué une réservation confirmée dans ce logement.</span>
          </div>

          {/* Résumé global */}
          <div className="flex gap-8">
            {/* Score global */}
            <div className="shrink-0 text-center">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="text-4xl font-bold tabular-nums">{averageRating?.toFixed(1)}</span>
              </div>
              <p className="mt-1 font-semibold">{getRatingLabel(averageRating)}</p>
              <p className="text-xs text-muted-foreground">
                Sur la base de {total} avis vérifiés
              </p>
            </div>

            {/* Sous-notes */}
            {hasSubRatings && (
              <div className="flex-1 space-y-2.5">
                {Object.entries(SUB_LABELS).map(([key, label]) =>
                  subRatings[key] != null ? (
                    <SubRatingBar key={key} label={label} value={subRatings[key]} />
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tri */}
        <div className="flex flex-wrap gap-2 border-b px-6 py-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                sort === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Liste avis — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 border-b pb-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-12 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t px-6 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
