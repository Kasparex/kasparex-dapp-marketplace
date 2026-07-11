'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { DEFAULT_DONATION_CAMPAIGN_IMAGE } from '@/lib/donations/constants';

export function CrowdKasCampaignPreviewModal({
  isOpen,
  onClose,
  metadata,
  coverUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  metadata: DonationCampaignMetadata;
  coverUrl?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;

  const image = coverUrl || DEFAULT_DONATION_CAMPAIGN_IMAGE;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close preview" onClick={onClose} />
      <div className="relative z-[1] w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl my-8">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Campaign preview</h2>
          <button type="button" onClick={onClose} className="k-control-btn">
            Close
          </button>
        </div>
        <div className="p-5 sm:p-8 space-y-6">
          <div className="aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">{metadata.title || 'Untitled campaign'}</h1>
          {metadata.description ? (
            <KxRichTextContent html={metadata.description} className="kx-prose" />
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">No description yet.</p>
          )}
          {metadata.goals && metadata.goals.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Goals</h3>
              <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                {metadata.goals.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
