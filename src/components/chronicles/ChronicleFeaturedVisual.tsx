import Image from 'next/image';
import { KxListingCardPlaceholderIcon } from '@/components/kx/KxListingCardPlaceholder';

export function ChronicleFeaturedVisual({
  imageUrl,
  alt,
  badge,
  ratioClass = 'aspect-video',
}: {
  imageUrl?: string | null;
  alt: string;
  badge?: string;
  ratioClass?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-8 ${ratioClass} bg-gradient-to-br from-zinc-100 via-zinc-50 to-cyan-500/15 dark:from-zinc-900 dark:via-zinc-950 dark:to-cyan-950/40`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 960px"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <KxListingCardPlaceholderIcon className="w-14 h-14 text-zinc-400/80" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Featured visual</p>
            <p className="text-sm text-zinc-400 mt-1 max-w-sm">
              Set{' '}
              <code className="text-xs font-mono bg-zinc-200/80 dark:bg-zinc-800 px-1 rounded">featuredImageUrl</code>{' '}
              in lore JSON to swap this for art.
            </p>
          </div>
        </div>
      )}
      {badge ? (
        <span className="absolute top-3 left-3 rounded-lg bg-black/50 dark:bg-black/60 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function ChronicleThumb({
  imageUrl,
  alt,
  className = '',
}: {
  imageUrl?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-200 to-cyan-500/20 dark:from-zinc-800 dark:to-cyan-950/50 ${className}`.trim()}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="200px" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
          <KxListingCardPlaceholderIcon className="w-8 h-8 opacity-60 text-zinc-400/80" />
        </div>
      )}
    </div>
  );
}
