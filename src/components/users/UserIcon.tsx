/**
 * User Icon Component
 * Specialized icon component for users (wallet addresses)
 */

'use client';

import { IconDisplay, type IconDisplayProps } from '@/components/IconDisplay';

export interface UserIconProps extends Omit<IconDisplayProps, 'type'> {
  address: string;
  size?: number;
  className?: string;
}

export function UserIcon({
  address,
  size = 40,
  className = '',
  ...props
}: UserIconProps) {
  return (
    <IconDisplay
      type="user"
      identifier={address}
      address={address}
      size={size}
      className={className}
      {...props}
    />
  );
}

