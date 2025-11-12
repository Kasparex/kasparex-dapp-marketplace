/**
 * Deterministic Icon Generation from Data
 * Generates consistent icons based on identifiers
 */

import { generateColorPalette, type ColorPalette } from './colors';
import { getDAppIconComponent } from './dAppIconLibrary';

export interface IconConfig {
  size?: number;
  borderRadius?: number;
  showLetter?: boolean;
  gradient?: boolean;
}

import React from 'react';

export interface GeneratedIcon {
  letter: string;
  iconComponent?: (props: { className?: string; color?: string }) => React.ReactElement; // SVG icon component for dApps
  colors: ColorPalette;
  config: IconConfig;
}

/**
 * Get first letter(s) from a string
 */
export function getInitials(text: string, maxLength: number = 2): string {
  if (!text) return '?';
  
  // Remove special characters and split by spaces
  const words = text.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  
  if (words.length === 0) return text.charAt(0).toUpperCase() || '?';
  
  if (words.length === 1) {
    // Single word - take first N characters
    return words[0].substring(0, maxLength).toUpperCase();
  }
  
  // Multiple words - take first letter of each
  return words
    .slice(0, maxLength)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Generate icon for a dApp
 * Uses single-color boxes with contrasting letters (dark box with light letter, or light box with dark letter)
 */
export function generateDAppIcon(
  name: string,
  category?: string,
  config: IconConfig = {}
): GeneratedIcon {
  const identifier = `${name}_${category || 'general'}`;
  const letter = getInitials(name, 1);
  const baseColors = generateColorPalette(identifier);
  
  // Create single-color box with contrasting letter
  // Determine if we should use dark or light box based on color brightness
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgb = hexToRgb(baseColors.primary);
  const brightness = rgb ? (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 : 128;
  
  // Use dark box with light letter if brightness > 128, otherwise light box with dark letter
  const useDarkBox = brightness > 128;
  
  // Adjust colors for better contrast
  let backgroundColor: string;
  let textColor: string;
  
  if (useDarkBox) {
    // Dark box (navy, dark orange, etc.) with light letter
    backgroundColor = baseColors.primary;
    // Lighten the text color for contrast
    const lightR = Math.min(255, rgb!.r + 100);
    const lightG = Math.min(255, rgb!.g + 100);
    const lightB = Math.min(255, rgb!.b + 100);
    textColor = `rgb(${lightR}, ${lightG}, ${lightB})`;
  } else {
    // Light box (light yellow, etc.) with dark letter
    // Lighten the background
    const lightR = Math.min(255, rgb!.r + 80);
    const lightG = Math.min(255, rgb!.g + 80);
    const lightB = Math.min(255, rgb!.b + 80);
    backgroundColor = `rgb(${lightR}, ${lightG}, ${lightB})`;
    // Darken the text color
    textColor = baseColors.primary;
  }

  return {
    letter,
    colors: {
      ...baseColors,
      backgroundColor,
      textColor,
    },
    config: {
      size: config.size || 48,
      borderRadius: config.borderRadius || 8,
      showLetter: config.showLetter !== false,
      gradient: false, // Always use single color for dApps
    },
  };
}

/**
 * Generate icon for a token
 */
export function generateTokenIcon(
  ticker: string,
  config: IconConfig = {}
): GeneratedIcon {
  const identifier = `token_${ticker}`;
  const letter = ticker.substring(0, 2).toUpperCase();
  const colors = generateColorPalette(identifier);

  return {
    letter,
    colors,
    config: {
      size: config.size || 40,
      borderRadius: config.borderRadius || 20, // Circular for tokens
      showLetter: config.showLetter !== false,
      gradient: config.gradient || true, // Tokens use gradients
    },
  };
}

/**
 * Generate icon for a user (from wallet address)
 */
export function generateUserIcon(
  address: string,
  config: IconConfig = {}
): GeneratedIcon {
  const identifier = `user_${address}`;
  const letter = getInitials(address.substring(2, 6), 2); // Use part of address
  const colors = generateColorPalette(identifier);

  return {
    letter,
    colors,
    config: {
      size: config.size || 40,
      borderRadius: config.borderRadius || 20, // Circular for users
      showLetter: config.showLetter !== false,
      gradient: config.gradient || false,
    },
  };
}

/**
 * Get category icon name (for future icon library integration)
 */
export function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    payment: 'CreditCard',
    dao: 'Users',
    subscription: 'Calendar',
    defi: 'TrendingUp',
    games: 'Gamepad2',
    tools: 'Wrench',
    minting: 'Coins',
    promotion: 'Megaphone',
    airdrops: 'Gift',
    tracker: 'BarChart',
    collabs: 'Handshake',
    general: 'Grid',
  };

  return categoryIcons[category.toLowerCase()] || 'Grid';
}

