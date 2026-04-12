'use client';

export function KxListingCardPlaceholderIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      className={`text-zinc-400 dark:text-zinc-600 ${className}`.trim()}
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

/** Standard empty media state for all listing cards. */
export function KxListingCardPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 ${className}`.trim()}
    >
      <KxListingCardPlaceholderIcon />
    </div>
  );
}
