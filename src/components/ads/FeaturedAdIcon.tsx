'use client';

/** Minimal featured marker: plain icon, no badge shell. */
export function FeaturedAdIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100 ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Featured placement"
      role="img"
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}
