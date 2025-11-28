/**
 * Color Extraction Utility
 * Extracts dominant colors from images to create gradient effects
 */

/**
 * Extract dominant colors from an image URL
 * Returns two colors suitable for a gradient effect
 */
export async function extractColorsFromImage(
  imageUrl: string | null | undefined
): Promise<[string, string]> {
  // Fallback colors if extraction fails
  const fallbackColors: [string, string] = ['#ffbc00', '#ff0058'];

  if (!imageUrl) {
    return fallbackColors;
  }

  try {
    // Create an image element to load the image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });

    // Create a canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return fallbackColors;
    }

    // Set canvas size (smaller for performance)
    const maxSize = 100;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Extract colors and count frequencies
    const colorMap = new Map<string, number>();
    const colors: Array<{ r: number; g: number; b: number; count: number }> = [];

    // Sample pixels (every 4th pixel for performance)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent or very dark pixels
      if (a < 128) continue;
      if (r < 30 && g < 30 && b < 30) continue; // Skip near-black
      if (r > 225 && g > 225 && b > 225) continue; // Skip near-white

      // Quantize colors to reduce noise
      const quantizedR = Math.floor(r / 32) * 32;
      const quantizedG = Math.floor(g / 32) * 32;
      const quantizedB = Math.floor(b / 32) * 32;
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;

      const count = (colorMap.get(colorKey) || 0) + 1;
      colorMap.set(colorKey, count);
    }

    // Convert to array and sort by frequency
    colorMap.forEach((count, key) => {
      const [r, g, b] = key.split(',').map(Number);
      colors.push({ r, g, b, count });
    });

    // Sort by frequency (most common first)
    colors.sort((a, b) => b.count - a.count);

    if (colors.length === 0) {
      return fallbackColors;
    }

    // Get the two most dominant colors
    const color1 = colors[0];
    let color2 = colors[1];

    // If we only have one color, create a complementary color
    if (!color2) {
      // Create a complementary color by inverting and adjusting
      color2 = {
        r: Math.min(255, 255 - color1.r + 50),
        g: Math.min(255, 255 - color1.g + 50),
        b: Math.min(255, 255 - color1.b + 50),
        count: 0,
      };
    }

    // Convert RGB to hex
    const toHex = (r: number, g: number, b: number): string => {
      return `#${[r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('')}`;
    };

    const hex1 = toHex(color1.r, color1.g, color1.b);
    const hex2 = toHex(color2.r, color2.g, color2.b);

    return [hex1, hex2];
  } catch (error) {
    console.warn('Failed to extract colors from image:', error);
    return fallbackColors;
  }
}

/**
 * Get fallback gradient colors based on category
 */
export function getCategoryGradientColors(category: string): [string, string] {
  const categoryGradients: Record<string, [string, string]> = {
    'defi': ['#ffbc00', '#ff0058'],
    'nft': ['#03a9f4', '#ff0058'],
    'gaming': ['#4dff03', '#00d0ff'],
    'dao': ['#9d4edd', '#ff6b6b'],
    'subscription': ['#ff6b9d', '#c44569'],
    'minting': ['#feca57', '#ff9ff3'],
    'airdrops': ['#48dbfb', '#0abde3'],
    'general': ['#ffbc00', '#ff0058'],
  };

  return categoryGradients[category.toLowerCase()] || ['#ffbc00', '#ff0058'];
}

