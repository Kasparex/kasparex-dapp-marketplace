/**
 * Deterministic Icon Generation from Data
 * Generates consistent icons based on identifiers
 */

import { generateColorPalette, type ColorPalette } from './colors';
import { getDAppIcon } from './iconLibrary';

export interface IconConfig {
  size?: number;
  borderRadius?: number;
  showLetter?: boolean;
  gradient?: boolean;
}

export interface GeneratedIcon {
  letter: string;
  icon?: string; // Emoji icon for dApps
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
 */
export function generateDAppIcon(
  name: string,
  category?: string,
  config: IconConfig = {}
): GeneratedIcon {
  const identifier = `${name}_${category || 'general'}`;
  const letter = getInitials(name, 1);
  const icon = getDAppIcon(identifier);
  const colors = generateColorPalette(identifier);

  return {
    letter,
    icon,
    colors,
    config: {
      size: config.size || 48,
      borderRadius: config.borderRadius || 8,
      showLetter: config.showLetter !== false,
      gradient: config.gradient || false,
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

