import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Grid2X2 } from 'lucide-react';

export default function ListingGallery({ images = [], title }) {
  const [lightbox, setLightbox] = useState(null);
  const thumbsRef = useRef(null);
  const touchStartX = useRef(null);
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

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (lightbox === null || !thumbsRef.current) return;
    const thumb = thumbsRef.current.children[lightbox];
    thumb?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [lightbox]);

  // Swipe support in lightbox
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const img2  = all[1] ?? all[0];
  const img3  = all[2] ?? all[0];
  const img4  = all[3] ?? all[0];
  const img5  = all[4] ?? all[3] ?? all[0];
  const extra = all.length > 4 ? all.length - 4 : 0;
  const dots  = Math.min(all.length, 6);

  return (
    <>
      {/* ── Mosaic grid ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm" style={{ height: 500 }}>

        {/* Mobile: full-bleed image + dots + button */}
        <div className="relative h-full w-full cursor-pointer sm:hidden" onClick={() => setLightbox(0)}>
          <Image src={all[0]} alt={title} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

          {/* Dot indicators */}
          {all.length > 1 && (
            <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-1.5">
              {Array.from({ length: dots }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === 0 ? 'h-1.5 w-5 bg-white' : 'h-1.5 w-1.5 bg-white/50'
                  }`}
                />
              ))}
              {all.length > 6 && <div className="h-1.5 w-1.5 rounded-full bg-white/30" />}
            </div>
          )}

          <GalleryButton count={all.length} onClick={() => setLightbox(0)} className="absolute bottom-4 right-4" />
        </div>

        {/* Desktop: Airbnb-style mosaic */}
        <div
          className="hidden h-full sm:grid gap-[3px]"
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

          {/* Top-right pair */}
          <GalleryCell
            src={img2} alt={`${title} 2`}
            onClick={() => setLightbox(all.length > 1 ? 1 : 0)}
            sizes="(max-width: 1200px) 22vw, 270px"
          />
          <GalleryCell
            src={img3} alt={`${title} 3`}
            className="rounded-tr-2xl"
            onClick={() => setLightbox(all.length > 2 ? 2 : 0)}
            sizes="(max-width: 1200px) 22vw, 270px"
          />

          {/* Bottom-right pair */}
          <GalleryCell
            src={img4} alt={`${title} 4`}
            onClick={() => setLightbox(all.length > 3 ? 3 : 0)}
            sizes="(max-width: 1200px) 22vw, 270px"
          />
          <GalleryCell
            src={img5} alt={`${title} 5`}
            className="rounded-br-2xl"
            onClick={() => setLightbox(all.length > 4 ? 4 : 0)}
            sizes="(max-width: 1200px) 22vw, 270px"
          >
            {extra > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-br-2xl bg-black/55 backdrop-blur-[2px] transition-colors hover:bg-black/68 cursor-pointer">
                <span className="text-3xl font-bold text-white">+{extra}</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-white/65">photos</span>
              </div>
            )}
          </GalleryCell>
        </div>

        {/* "Voir toutes" button — desktop */}
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
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Top bar */}
          <div
            className="flex shrink-0 items-center justify-between px-5 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="max-w-xs truncate text-sm font-medium text-white/50">{title}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold tabular-nums text-white/70">
                {lightbox + 1}
                <span className="mx-1 text-white/30">/</span>
                {all.length}
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
          <div className="h-px w-full shrink-0 bg-white/10">
            <div
              className="h-full bg-white/60 transition-all duration-300 ease-out"
              style={{ width: `${((lightbox + 1) / all.length) * 100}%` }}
            />
          </div>

          {/* Main image */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev */}
            <button
              aria-label="Précédente"
              onClick={prev}
              className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/22 sm:left-6"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div key={lightbox} className="relative mx-14 h-full w-full animate-fade-in">
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
              className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/22 sm:right-6"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="shrink-0 pb-5 pt-3" onClick={(e) => e.stopPropagation()}>
            <div
              ref={thumbsRef}
              className="flex gap-2 overflow-x-auto px-4 sm:justify-center"
              style={{ scrollbarWidth: 'none' }}
            >
              {all.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className={`relative h-[64px] w-[90px] shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                    i === lightbox
                      ? 'scale-105 opacity-100 ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-40 hover:opacity-75'
                  }`}
                >
                  <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="90px" />
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
        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        sizes={sizes}
        priority={priority}
      />
      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/18" />
      {children}
    </div>
  );
}

function GalleryButton({ count, onClick, className = '' }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`items-center gap-2 rounded-xl border border-white/25 bg-black/45 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:shadow-xl ${className}`}
    >
      <Grid2X2 className="h-4 w-4" />
      <span>{count} photo{count > 1 ? 's' : ''}</span>
    </button>
  );
}
