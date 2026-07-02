'use client';

function LockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function UnlockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Informational-only premium indicator for vBlog articles that include the gated
 * Premium Content module. Non-interactive (visual badge, not clickable).
 */
export function VBlogPremiumBadge({
  unlocked = false,
  className = '',
  size = 'md',
  title = 'Includes premium content',
}: {
  unlocked?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}) {
  const padClass = size === 'sm' ? 'p-1' : 'p-1.5';
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <span
      aria-label={title}
      title={title}
      className={`inline-flex items-center justify-center rounded-lg border border-amber-400/60 bg-amber-50/90 ${padClass} text-amber-700 backdrop-blur-md dark:border-amber-300/40 dark:bg-amber-500/15 dark:text-amber-300 ${className}`.trim()}
    >
      {unlocked ? <UnlockIcon className={iconClass} /> : <LockIcon className={iconClass} />}
    </span>
  );
}
