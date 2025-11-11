/**
 * Token Icon Component
 * Specialized icon component for tokens with ticker display
 */

'use client';

import { IconDisplay, type IconDisplayProps } from '@/components/IconDisplay';

export interface TokenIconProps extends Omit<IconDisplayProps, 'type' | 'identifier' | 'ticker'> {
  ticker: string;
  size?: number;
  className?: string;
}

export function TokenIcon({
  ticker,
  size = 40,
  className = '',
  ...props
}: TokenIconProps) {
  return (
    <IconDisplay
      type="token"
      identifier={ticker}
      ticker={ticker}
      size={size}
      className={className}
      gradient={true}
      {...props}
    />
  );
}

