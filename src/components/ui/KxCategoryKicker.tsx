import type { ReactNode } from 'react';
import { KX_PANEL_LABEL } from '@/lib/ui/kxTypography';

/** Category kicker above page titles (platform standard tilt bar + spacing). */
export function KxCategoryKicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`kx-page-kicker ${className}`.trim()}>
      <div
        className="hub-tilt-bar-sm h-4 w-1 shrink-0 rounded-full -skew-y-12"
        aria-hidden="true"
      />
      <p className={KX_PANEL_LABEL}>{children}</p>
    </div>
  );
}
