import type { ReactNode } from 'react';
import { KX_LISTING_CATEGORY_CHIP } from '@/lib/ui/kxLayout';

/** Category chip for listing cards (DApp, Hub, vBlog). */
export function KxListingCategoryChip({
  children,
  icon,
  className = '',
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${KX_LISTING_CATEGORY_CHIP} ${className}`.trim()}>
      {icon ? <span className="inline-flex shrink-0 opacity-80">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}
