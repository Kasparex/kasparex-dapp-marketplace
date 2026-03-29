import Image from 'next/image';

function PlaceholderIcon({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      className={`text-zinc-400/80 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

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
          <PlaceholderIcon />
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
          <PlaceholderIcon className="w-8 h-8 opacity-60" />
        </div>
      )}
    </div>
  );
}
