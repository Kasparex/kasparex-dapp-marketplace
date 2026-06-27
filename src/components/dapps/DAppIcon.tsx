/**
 * dApp Icon Component
 * Specialized icon component for dApps with category styling
 */

'use client';

import { IconDisplay, type IconDisplayProps } from '@/components/IconDisplay';
import { getCategoryIcon } from '@/lib/icons/generator';

export interface DAppIconProps extends Omit<IconDisplayProps, 'type' | 'identifier' | 'name'> {
  dAppName: string;
  category?: string;
  /** Custom uploaded logo URL (replaces generated letter icon). */
  imageSrc?: string;
  size?: number;
  className?: string;
}

export function DAppIcon({
  dAppName,
  category = 'general',
  imageSrc,
  size = 48,
  className = '',
  ...props
}: DAppIconProps) {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        width={size}
        height={size}
        className={`object-cover shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 ${className}`.trim()}
        style={{ width: size, height: size }}
      />
    );
  }

  // Get category icon name for future icon library integration
  const categoryIconName = getCategoryIcon(category);

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

