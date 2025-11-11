/**
 * Hash-based Color Palette System
 * Generates deterministic colors from identifiers
 */

/**
 * Generate a color from a hash string
 */
export function hashToColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate RGB values
  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  // Ensure minimum brightness for accessibility
  const minBrightness = 50;
  const adjustedR = Math.max(r, minBrightness);
  const adjustedG = Math.max(g, minBrightness);
  const adjustedB = Math.max(b, minBrightness);

  return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
}

/**
 * Generate a hex color from a hash string
 */
export function hashToHexColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate hex color
  const color = (hash & 0x00ffffff).toString(16).padStart(6, '0');
  return `#${color}`;
}

/**
 * Generate a gradient from a hash string
 */
export function hashToGradient(input: string): string {
  const color1 = hashToHexColor(input);
  const color2 = hashToHexColor(input + '2'); // Slight variation
  
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

/**
 * Get contrast color (black or white) for text on a background
 */
export function getContrastColor(backgroundColor: string): string {
  // Extract RGB values
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return '#000000';

  const r = parseInt(rgb[0]);
  const g = parseInt(rgb[1]);
  const b = parseInt(rgb[2]);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Generate a color palette for an identifier
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  gradient: string;
  textColor: string;
  backgroundColor: string;
}

export function generateColorPalette(identifier: string): ColorPalette {
  const primary = hashToHexColor(identifier);
  const secondary = hashToHexColor(identifier + '_secondary');
  const gradient = hashToGradient(identifier);
  const textColor = getContrastColor(primary);
  const backgroundColor = primary;

  return {
    primary,
    secondary,
    gradient,
    textColor,
    backgroundColor,
  };
}

/**
 * Generate a dark mode variant of a color
 */
export function darkenColor(color: string, amount: number = 0.3): string {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return color;

  const r = Math.max(0, parseInt(rgb[0]) - Math.floor(255 * amount));
  const g = Math.max(0, parseInt(rgb[1]) - Math.floor(255 * amount));
  const b = Math.max(0, parseInt(rgb[2]) - Math.floor(255 * amount));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate a light mode variant of a color
 */
export function lightenColor(color: string, amount: number = 0.3): string {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return color;

  const r = Math.min(255, parseInt(rgb[0]) + Math.floor(255 * amount));
  const g = Math.min(255, parseInt(rgb[1]) + Math.floor(255 * amount));
  const b = Math.min(255, parseInt(rgb[2]) + Math.floor(255 * amount));

  return `rgb(${r}, ${g}, ${b})`;
}

