'use client';

import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

/** vBlog-scoped Benefits panel (Create Article + Author dashboard). */
export function VBlogDashboardBenefitsPanel({
  className = '',
  variant = 'panel',
  hideBuyButton = false,
}: {
  className?: string;
  variant?: 'panel' | 'compact';
  hideBuyButton?: boolean;
}) {
  return (
    <HubBenefitsPanel
      scope="vblog"
      className={className}
      variant={variant}
      hideBuyButton={hideBuyButton}
    />
  );
}
