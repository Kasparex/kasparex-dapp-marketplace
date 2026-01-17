/**
 * Reusable Icon Component
 * Displays deterministic icons with colors
 */

'use client';

import { useMemo } from 'react';
import { generateDAppIcon, generateTokenIcon, generateUserIcon, type GeneratedIcon } from '@/lib/icons/generator';
import { type ColorPalette } from '@/lib/icons/colors';

export interface IconDisplayProps {
  type: 'dapp' | 'token' | 'user';
  identifier: string;
  name?: string;
  category?: string;
  ticker?: string;
  address?: string;
  size?: number;
  className?: string;
  showLetter?: boolean;
  gradient?: boolean;
}

export function IconDisplay({
  type,
  identifier,
  name,
  category,
  ticker,
  address,
  size = 48,
  className = '',
  showLetter = true,
  gradient = false,
}: IconDisplayProps) {
  const icon = useMemo<GeneratedIcon>(() => {
    switch (type) {
      case 'dapp':
        return generateDAppIcon(name || identifier, category, {
          size,
          showLetter,
          gradient,
        });
      case 'token':
        return generateTokenIcon(ticker || identifier, {
          size,
          showLetter,
          gradient,
        });
      case 'user':
        return generateUserIcon(address || identifier, {
          size,
          showLetter,
          gradient,
        });
      default:
        return generateDAppIcon(identifier, category, { size, showLetter, gradient });
    }
  }, [type, identifier, name, category, ticker, address, size, showLetter, gradient]);

  const style = useMemo(() => {
    const iconSize = icon.config.size || size || 48;
    // Check if className includes rounded-full to override borderRadius
    const isRoundedFull = className.includes('rounded-full');
    const borderRadius = isRoundedFull ? '50%' : `${icon.config.borderRadius || 8}px`;
    
    const baseStyle: React.CSSProperties = {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
      borderRadius: borderRadius,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: `${Math.floor(iconSize * 0.6)}px`,
      color: icon.colors.textColor,
      flexShrink: 0,
    };

    if (icon.config.gradient) {
      return {
        ...baseStyle,
        background: icon.colors.gradient,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: icon.colors.backgroundColor,
    };
  }, [icon, size, className]);

  return (
    <div
      style={style}
      className={className}
      aria-label={`${type} icon for ${identifier}`}
    >
      {icon.config.showLetter && icon.letter}
    </div>
  );
}

