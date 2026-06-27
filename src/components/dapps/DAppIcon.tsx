/**
 * dApp Icon Component
 * Specialized icon component for dApps with category styling
 */

'use client';

import { IconDisplay, type IconDisplayProps } from '@/components/IconDisplay';
import { getDAppLogoSrc, type DApp } from '@/lib/dapps';

export interface DAppIconProps extends Omit<IconDisplayProps, 'type' | 'identifier' | 'name'> {
  dAppName: string;
  category?: string;
  /** Custom uploaded logo URL (replaces generated letter icon). */
  imageSrc?: string;
  /** When set, logo is resolved via getDAppLogoSrc (overridden by imageSrc). */
  dapp?: Pick<DApp, 'logoImage' | 'image' | 'featuredImage' | 'directoryListing'>;
  size?: number;
  className?: string;
}

export function DAppIcon({
  dAppName,
  category = 'general',
  imageSrc,
  dapp,
  size = 48,
  className = '',
  ...props
}: DAppIconProps) {
  const resolvedSrc = imageSrc ?? (dapp ? getDAppLogoSrc(dapp) : undefined);

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt=""
        width={size}
        height={size}
        className={`object-cover shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 ${className}`.trim()}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <IconDisplay
      type="dapp"
      identifier={dAppName}
      name={dAppName}
      category={category}
      size={size}
      className={className}
      {...props}
    />
  );
}

