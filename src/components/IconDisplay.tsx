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
    const borderRadius = icon.config.borderRadius || 8;
    
    // For dApp icons, use modern gradient with better color combinations
    const isDApp = type === 'dapp';
    const iconScale = isDApp ? 0.5 : 0.6; // Smaller icons for dApps (50% vs 60%)
    
    const baseStyle: React.CSSProperties = {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
      borderRadius: `${borderRadius}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: `${Math.floor(iconSize * iconScale)}px`,
      color: icon.colors.textColor,
      flexShrink: 0,
      padding: isDApp ? '2px' : '0', // Small padding for dApp icons
    };

    if (isDApp) {
      // Modern gradient for dApp icons with better color combinations
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, ${icon.colors.primary} 0%, ${icon.colors.secondary} 100%)`,
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
      };
    }

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
  }, [icon, size, type]);

  return (
    <div
      style={style}
      className={className}
      aria-label={`${type} icon for ${identifier}`}
    >
      {type === 'dapp' && icon.iconComponent ? (
        icon.iconComponent({ 
          className: 'w-full h-full',
          color: icon.colors.textColor 
        })
      ) : (
        icon.config.showLetter && icon.letter
      )}
    </div>
  );
}

