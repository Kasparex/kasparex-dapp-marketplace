'use client';

import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { summarizeProductAssets } from '@/lib/store/assetSummary';
import type { Product } from '@/lib/store/types';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';

interface StoreProductPremiumPanelProps {
  product: Product;
  hasAccess: boolean;
  variant?: 'sidebar' | 'embedded';
}

function AssetPreviewTable({ product }: { product: Product }) {
  const { fileCount, formats, rows } = summarizeProductAssets(product);

  if (fileCount === 0 && !product.content?.trim()) {
    return <p className="kx-body">Seller has not attached downloadable files yet.</p>;
  }

  const tableRows: KxDataTableRow[] = [
    { label: 'Files included', value: String(fileCount), mono: false },
  ];

  if (formats.length > 0) {
    tableRows.push({ label: 'Formats', value: formats.join(', '), mono: false });
  }

  if (product.content?.trim()) {
    tableRows.push({ label: 'Unlock text', value: 'Included', mono: false });
  }

  for (const row of rows) {
    tableRows.push({
      label: row.label,
      valueNode: (
        <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {row.format}
        </span>
      ),
      mono: false,
    });
  }

  return <KxDataTable rows={tableRows} />;
}

export function StoreProductPremiumPanel({
  product,
  hasAccess,
  variant = 'sidebar',
}: StoreProductPremiumPanelProps) {
  const panel = hasAccess ? (
    <div className="space-y-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
      <div>
        <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">Premium content unlocked</h3>
        <p className="mt-1 kx-body">Your purchase includes the files below. Download them from the Product tab.</p>
      </div>
      <AssetPreviewTable product={product} />
      {product.assetCids.length > 0 ? (
        <div className="grid gap-2">
          {product.assetCids.map((cid, index) => (
            <a
              key={cid}
              href={getBestGatewayUrl(cid)}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold transition-colors hover:border-[#02abb8]/40 hover:text-[#02abb8] dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span>{product.assetFileNames?.[index] ?? `Download file ${index + 1}`}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  ) : (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-cyan-50/30 p-5 dark:border-zinc-800 dark:from-zinc-900 dark:to-cyan-950/20">
      <div>
        <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">Premium content locked</h3>
        <p className="mt-1 kx-body">Purchase this product to access downloads and protected content.</p>
      </div>
      <AssetPreviewTable product={product} />
    </div>
  );

  if (variant === 'embedded') return panel;

  return panel;
}
