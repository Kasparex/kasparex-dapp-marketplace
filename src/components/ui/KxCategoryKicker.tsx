import type { ReactNode } from 'react';
import { KX_PANEL_LABEL } from '@/lib/ui/kxTypography';

/** Category kicker above page titles (platform standard tilt bar + spacing). */
export function KxCategoryKicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`kx-page-kicker ${className}`.trim()}>
      <div
        className="h-4 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
        aria-hidden="true"
      />
      <p className={KX_PANEL_LABEL}>{children}</p>
    </div>
  );
}
