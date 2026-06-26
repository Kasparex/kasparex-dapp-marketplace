import type { Product } from '@/lib/store/types';

export type ProductAssetPreviewRow = {
  label: string;
  format: string;
};

export function extractFileExtension(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0 || dot === trimmed.length - 1) return 'FILE';
  return trimmed.slice(dot + 1).toUpperCase();
}

export function summarizeProductAssets(product: Product): {
  fileCount: number;
  formats: string[];
  rows: ProductAssetPreviewRow[];
} {
  const count = product.assetCids.length;
  const names = product.assetFileNames ?? [];

  const rows: ProductAssetPreviewRow[] = product.assetCids.map((_, index) => {
    const name = names[index];
    if (name) {
      return { label: name, format: extractFileExtension(name) };
    }
    return { label: `File ${index + 1}`, format: 'FILE' };
  });

  const formats = [...new Set(rows.map((row) => row.format).filter((ext) => ext !== 'FILE'))];

  return { fileCount: count, formats, rows };
}
