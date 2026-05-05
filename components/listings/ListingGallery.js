import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

export default function ListingGallery({ images = [], title }) {
  const [lightbox, setLightbox] = useState(null);
  const all = images.length ? images : ['/placeholder.jpg'];

  const prev = useCallback(() => setLightbox((i) => (i - 1 + all.length) % all.length), [all.length]);
  const next = useCallback(() => setLightbox((i) => (i + 1) % all.length), [all.length]);

  // Keyboard navigation + scroll lock
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     setLightbox(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, prev, next]);

  const img2 = all[1] ?? all[0];
  const img3 = all[2] ?? all[0];
  const img4 = all[3] ?? all[0];
  const extra = all.length > 4 ? all.length - 4 : 0;

  return (
    <>
      {/* ── Mosaic grid ── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ height: 480 }}>

        {/* Mobile : image unique + bouton */}
        <div
          className="relative h-full w-full cursor-pointer sm:hidden"
          onClick={() => setLightbox(0)}
        >
          <Image src={all[0]} alt={title} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
          <GalleryButton count={all.length} onClick={() => setLightbox(0)} className="absolute bottom-4 right-4" />
        </div>

        {/* Desktop : grille mosaïque */}
        <div
          className="hidden h-full sm:grid gap-1"
          style={{ gridTemplateColumns: '3fr 1fr 1fr', gridTemplateRows: '1fr 1fr' }}
        >
          {/* Grande image principale */}
          <GalleryCell
            src={all[0]} alt={title}
            className="row-span-2 rounded-l-2xl"
            onClick={() => setLightbox(0)}
            sizes="(max-width: 1200px) 55vw, 700px"
            priority
          />

          {/* Top-right */}
          <GalleryCell
            src={img2} alt={`${title} 2`}
            className="rounded-tr-none"
            onClick={() => setLightbox(all.length > 1 ? 1 : 0)}
            sizes="(max-width: 1200px) 20vw, 250px"
          />

          {/* Top-far-right */}
          <GalleryCell
            src={img3} alt={`${title} 3`}
            className="rounded-tr-2xl"
            onClick={() => setLightbox(all.length > 2 ? 2 : 0)}
            sizes="(max-width: 1200px) 20vw, 250px"
          />

          {/* Bottom-right */}
          <GalleryCell
            src={img4} alt={`${title} 4`}
            className=""
            onClick={() => setLightbox(all.length > 3 ? 3 : 0)}
            sizes="(max-width: 1200px) 20vw, 250px"
          />

          {/* Bottom-far-right — +X overlay */}
          <GalleryCell
            src={all[4] ?? img4} alt={`${title} 5`}
            className="rounded-br-2xl"
            onClick={() => setLightbox(all.length > 4 ? 4 : 0)}
            sizes="(max-width: 1200px) 20vw, 250px"
          >
            {extra > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-br-2xl bg-black/55 backdrop-blur-[1px] hover:bg-black/65 transition-colors cursor-pointer">
                <span className="text-2xl font-bold text-white">+{extra}</span>
                <span className="text-xs font-medium tracking-wide text-white/80">photos</span>
              </div>
            )}
          </GalleryCell>
        </div>

        {/* Bouton "Voir toutes" — desktop */}
        <GalleryButton
          count={all.length}
          onClick={() => setLightbox(0)}
          className="absolute bottom-4 right-4 hidden sm:flex"
        />
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-black/96"
          onClick={() => setLightbox(null)}
        >
          {/* Top bar */}
          <div
            className="flex shrink-0 items-center justify-between px-5 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="max-w-sm truncate text-sm font-medium text-white/60">{title}</span>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                {lightbox + 1} / {all.length}
              </span>
              <button
                aria-label="Fermer"
                onClick={() => setLightbox(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] w-full shrink-0 bg-white/10">
            <div
              className="h-full bg-white/50 transition-all duration-300"
              style={{ width: `${((lightbox + 1) / all.length) * 100}%` }}
            />
          </div>

          {/* Main image */}
          <div
            className="relative flex flex-1 items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev */}
            <button
              aria-label="Précédente"
              onClick={prev}
              className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:left-6"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div key={lightbox} className="relative mx-16 h-full w-full animate-fade-in">
              <Image
                src={all[lightbox]}
                alt={`${title} — photo ${lightbox + 1}`}
                fill
                className="object-contain drop-shadow-2xl"
                sizes="90vw"
                priority
              />
            </div>

            {/* Next */}
            <button
              aria-label="Suivante"
              onClick={next}
              className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:right-6"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div
            className="shrink-0 pb-5 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center gap-2 overflow-x-auto px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {all.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className={`relative h-[56px] w-20 shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                    i === lightbox
                      ? 'scale-105 ring-2 ring-white ring-offset-2 ring-offset-black opacity-100'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <Image src={src} alt={`${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Helpers ── */

function GalleryCell({ src, alt, className = '', onClick, sizes, priority, children }) {
  return (
    <div
      className={`group relative cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        sizes={sizes}
        priority={priority}
      />
      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />
      {children}
    </div>
  );
}

function GalleryButton({ count, onClick, className = '' }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/60 hover:shadow-xl ${className}`}
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      <span>{count} photo{count > 1 ? 's' : ''}</span>
    </button>
  );
}
