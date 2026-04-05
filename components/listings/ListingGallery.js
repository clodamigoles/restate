import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ListingGallery({ images = [], title }) {
  const [lightbox, setLightbox] = useState(null);
  const all = images.length ? images : ['/placeholder.jpg'];

  function prev() {
    setLightbox((i) => (i - 1 + all.length) % all.length);
  }
  function next() {
    setLightbox((i) => (i + 1) % all.length);
  }

  return (
    <>
      {/* Grille d'images */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl" style={{ height: '360px' }}>
        {/* Image principale */}
        <div
          className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden"
          onClick={() => setLightbox(0)}
        >
          <Image src={all[0]} alt={title} fill className="object-cover hover:brightness-90 transition" />
        </div>
        {/* Miniatures */}
        {all.slice(1, 5).map((img, i) => (
          <div
            key={i}
            className="relative cursor-pointer overflow-hidden"
            onClick={() => setLightbox(i + 1)}
          >
            <Image src={img} alt={`${title} ${i + 2}`} fill className="object-cover hover:brightness-90 transition" />
            {i === 3 && all.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-lg font-semibold text-white">+{all.length - 5}</span>
              </div>
            )}
          </div>
        ))}
        {/* Remplir les cases vides */}
        {all.length < 5 &&
          Array.from({ length: 4 - (all.length - 1) }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-muted" />
          ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div
            className="relative h-[80vh] w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={all[lightbox]}
              alt={`${title} - ${lightbox + 1}`}
              fill
              className="object-contain"
            />
          </div>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-4 text-sm text-white/70">
            {lightbox + 1} / {all.length}
          </span>
        </div>
      )}
    </>
  );
}
