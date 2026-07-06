'use client';

import type { ReactNode } from 'react';
import { HUB_TILT_BAR, HUB_LISTING_TITLE } from '@/lib/hub/hubLayout';

export function HubListingTitleRow(props: {
  title: string;
  count: number;
  countLabel: string;
  countLoading?: boolean;
  loadingText?: string;
  benefits?: ReactNode;
  showTilt?: boolean;
  /** Reserved for layout hooks; tilt color follows HubAccentScope CSS variables. */
  projectId?: string;
  accentColor?: string;
  className?: string;
}) {
  const {
    title,
    count,
    countLabel,
    countLoading = false,
    loadingText = 'Loading...',
    benefits,
    showTilt = true,
    className = '',
  } = props;

  const plural = count !== 1 ? 's' : '';
  const countText = countLoading
    ? loadingText
    : `${count} ${countLabel}${plural} found`;

  return (
    <div className={`mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}>
      <div className="min-w-0 flex items-stretch gap-5">
        {showTilt ? <span className={HUB_TILT_BAR} aria-hidden="true" /> : null}
        <div className="min-w-0">
          <h2 className={HUB_LISTING_TITLE}>{title}</h2>
          <p className="kx-body">{countText}</p>
        </div>
      </div>
      {benefits ? (
        <div className="w-full sm:w-auto sm:max-w-[min(100%,42rem)]">{benefits}</div>
      ) : null}
    </div>
  );
}
