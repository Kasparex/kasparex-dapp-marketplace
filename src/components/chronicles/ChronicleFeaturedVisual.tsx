import Image from 'next/image';
import {
  KX_LISTING_PLACEHOLDER_GRADIENT,
  KX_LISTING_PLACEHOLDER_ICON,
} from '@/lib/ui/kxListingPlaceholder';

function PlaceholderIcon({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      className={`${KX_LISTING_PLACEHOLDER_ICON} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
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
      className={`relative w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-8 ${ratioClass} ${KX_LISTING_PLACEHOLDER_GRADIENT}`}
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Featured visual
          </p>
        </div>
      )}
      {badge ? (
        <span className="absolute top-3 left-3 rounded-md bg-black/50 dark:bg-black/60 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 backdrop-blur-sm">
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
      className={`relative overflow-hidden rounded-xl ${KX_LISTING_PLACEHOLDER_GRADIENT} ${className}`.trim()}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="200px" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <PlaceholderIcon className="w-8 h-8 opacity-80" />
        </div>
      )}
    </div>
  );
}
