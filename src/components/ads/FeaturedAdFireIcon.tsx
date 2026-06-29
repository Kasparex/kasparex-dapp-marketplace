'use client';

export function FeaturedAdFireIcon({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/40 ring-2 ring-white/90 dark:ring-zinc-900/90 ${className}`}
      title="Featured placement"
      aria-label="Featured placement"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 23c-1.1 0-2-.9-2-2 0-.55.22-1.05.58-1.41C9.5 18.8 8 16.5 8 14c0-2.2 1.2-4.1 3-5.1-.3-1.4.2-2.9 1.3-3.9C13.4 4.3 15 4 16.5 4.5c2.1.7 3.5 2.6 3.5 4.8 0 .8-.2 1.6-.5 2.3 1.4.9 2.5 2.4 2.5 4.2 0 2.8-2.2 5-5 5h-5z" />
      </svg>
    </span>
  );
}
