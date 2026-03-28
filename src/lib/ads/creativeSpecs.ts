import type { AdFormat, AdSlotId } from '@/lib/ads/types';

export interface AdCreativeSpec {
  format: AdFormat;
  title: string;
  aspectRatioLabel: string;
  minWidth: number;
  minHeight: number;
  recommendedWidth: number;
  recommendedHeight: number;
  maxFileSizeMb: number;
  notes: string[];
}

export const AD_CREATIVE_SPECS: Record<AdFormat, AdCreativeSpec> = {
  square: {
    format: 'square',
    title: 'Square',
    aspectRatioLabel: '1 : 1',
    minWidth: 400,
    minHeight: 400,
    recommendedWidth: 600,
    recommendedHeight: 600,
    maxFileSizeMb: 2,
    notes: ['Used for halo placements next to hero content.', 'Avoid text or logos in the outer 8% (safe area).'],
  },
  rectangle: {
    format: 'rectangle',
    title: 'Rectangle (banner)',
    aspectRatioLabel: 'Wide (e.g. 16:9 or footer strip)',
    minWidth: 720,
    minHeight: 200,
    recommendedWidth: 1400,
    recommendedHeight: 400,
    maxFileSizeMb: 2,
    notes: [
      'Footer strip: aim for ~3.2:1 to ~3.6:1 width:height (e.g. 1400×400).',
      'Sidebar-style rectangles work well around 3:2 (e.g. 900×600).',
    ],
  },
  tall: {
    format: 'tall',
    title: 'Tall',
    aspectRatioLabel: '3:4 (portrait)',
    minWidth: 400,
    minHeight: 520,
    recommendedWidth: 600,
    recommendedHeight: 800,
    maxFileSizeMb: 2,
    notes: ['Portrait format for tall slots only.', 'Keep key content in the centre third.'],
  },
};

export function defaultFormatForSlot(slotId: AdSlotId): AdFormat {
  if (slotId === 'FOOTER_BLOCK') return 'rectangle';
  if (slotId === 'SIDEBAR_RANDOM') return 'rectangle';
  return 'square';
}

/** Returns null if OK, or a user-facing error string. */
export function validateUploadedImageFile(
  file: File,
  format: AdFormat
): Promise<string | null> {
  const spec = AD_CREATIVE_SPECS[format];
  const maxBytes = spec.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return Promise.resolve(`File is too large (max ${spec.maxFileSizeMb} MB).`);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w < spec.minWidth || h < spec.minHeight) {
        resolve(
          `Image is ${w}×${h}px. For ${spec.title}, use at least ${spec.minWidth}×${spec.minHeight}px (recommended ${spec.recommendedWidth}×${spec.recommendedHeight}px).`
        );
        return;
      }
      resolve(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('Could not read this image. Try PNG, JPG, or WebP.');
    };
    img.src = url;
  });
}
