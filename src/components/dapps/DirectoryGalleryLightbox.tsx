'use client';

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

type DirectoryGalleryLightboxProps = {
  images: { url: string; alt: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function DirectoryGalleryLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: DirectoryGalleryLightboxProps) {
  const image = images[index];

  const goPrev = useCallback(() => {
    onNavigate(index <= 0 ? images.length - 1 : index - 1);
  }, [images.length, index, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(index >= images.length - 1 ? 0 : index + 1);
  }, [images.length, index, onNavigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose]);

  if (!image) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery image preview"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close gallery"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      ) : null}

      <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.url}
          alt={image.alt}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        />
        <p className="mt-3 text-center text-sm text-zinc-300">
          {image.alt}
          {images.length > 1 ? ` (${index + 1} / ${images.length})` : ''}
        </p>
      </div>
    </div>,
    document.body,
  );
}
