import type { ReactNode } from 'react';

/** Form field label with platform tilt accent (matches DAppSectionHeader). */
export function KxFormFieldLabel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`.trim()}>
      <span
        className="h-3.5 w-0.5 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
        aria-hidden="true"
      />
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{children}</span>
    </span>
  );
}
