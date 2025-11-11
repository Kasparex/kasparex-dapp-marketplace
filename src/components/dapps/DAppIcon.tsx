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
  size?: number;
  className?: string;
}

export function DAppIcon({
  dAppName,
  category = 'general',
  size = 48,
  className = '',
  ...props
}: DAppIconProps) {
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

