import type { MouseEvent, ReactNode } from 'react';
import { KX_LISTING_CATEGORY_CHIP } from '@/lib/ui/kxLayout';

/** Category chip for listing cards (DApp, Hub, vBlog). Becomes a button when `onClick` is provided. */
export function KxListingCategoryChip({
  children,
  icon,
  className = '',
  onClick,
  title,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}) {
  const inner = (
    <>
      {icon ? <span className="inline-flex shrink-0 opacity-80">{icon}</span> : null}
      <span>{children}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${KX_LISTING_CATEGORY_CHIP} cursor-pointer transition-colors hover:border-[color:var(--hub-accent)]/40 hover:text-[color:var(--hub-accent)] dark:hover:text-[color:var(--hub-accent-light)] ${className}`.trim()}
      >
        {inner}
      </button>
    );
  }

  return <div className={`${KX_LISTING_CATEGORY_CHIP} ${className}`.trim()}>{inner}</div>;
}
