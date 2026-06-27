'use client';

import { useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { DirectoryGalleryLightbox } from '@/components/dapps/DirectoryGalleryLightbox';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { DAppWidgetHeader } from '@/components/dapps/DAppWidgetHeader';
import { DAppWidgetFooter } from '@/components/dapps/DAppWidgetFooter';
import { covenantPanelClass } from '@/components/dapps/covenant/CovenantWidgetUi';

type DirectoryDAppOverviewPanelProps = {
  dapp: DApp;
  listing: DirectoryListing;
};

function LinkGrid({ links, emptyLabel }: { links: { label: string; url: string }[]; emptyLabel?: string }) {
  if (links.length === 0) {
    return emptyLabel ? (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={`${link.label}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:border-[#02abb8]/50 hover:text-[#02abb8] transition-colors"
        >
          {link.label}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}

export function DirectoryDAppOverviewPanel({ dapp, listing }: DirectoryDAppOverviewPanelProps) {
  const category = getCategoryById(listing.category);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages = useMemo(
    () =>
      listing.galleryCids.map((cid, index) => ({
        url: getBestGatewayUrl(cid),
        alt: listing.galleryFileNames[index] || `${dapp.name} screenshot ${index + 1}`,
      })),
    [listing.galleryCids, listing.galleryFileNames, dapp.name],
  );

  const optionalFiles = useMemo(
    () =>
      listing.optionalFileCids.map((cid, index) => ({
        cid,
        name: listing.optionalFileNames[index] || 'Download',
        url: getBestGatewayUrl(cid),
      })),
    [listing.optionalFileCids, listing.optionalFileNames],
  );

  const networkLabel =
    listing.networkLayer === 'multichain'
      ? 'Multi'
      : `${listing.networkLayer} layer`;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <DAppWidgetHeader dapp={dapp} hideEmbed />

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
        <header className="space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {category ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {category.emoji} {category.name}
              </span>
            ) : null}
            <span className="inline-flex items-center px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Community
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {networkLabel}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{dapp.name}</h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{listing.shortDescription}</p>
          {listing.tags.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {listing.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {listing.actionButtons.length > 0 ? (
          <div className={covenantPanelClass}>
            <DAppSectionHeader title="Quick actions" />
            <div className="flex flex-wrap gap-3">
              {listing.actionButtons.map((btn) => (
                <a
                  key={`${btn.label}-${btn.url}`}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="k-cta-primary inline-flex items-center gap-2 !w-auto px-6"
                >
                  {btn.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {listing.supportedChains.length > 0 ? (
          <div className={covenantPanelClass}>
            <DAppSectionHeader title="Supported chains" />
            <div className="flex flex-wrap gap-2">
              {listing.supportedChains.map((chain) => (
                <span
                  key={chain}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {chain}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className={covenantPanelClass}>
          <DAppSectionHeader title="Links" />
          <LinkGrid
            links={[
              ...(listing.websiteUrl ? [{ label: 'Website', url: listing.websiteUrl }] : []),
              ...listing.socialLinks,
              ...listing.documentationLinks,
            ]}
            emptyLabel="No links provided."
          />
        </div>

        {galleryImages.length > 0 ? (
          <div className={covenantPanelClass}>
            <DAppSectionHeader title="Gallery" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {galleryImages.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="block aspect-video overflow-hidden rounded-xl border border-zinc-200 text-left dark:border-zinc-800"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {optionalFiles.length > 0 ? (
          <div className={covenantPanelClass}>
            <DAppSectionHeader title="Files" />
            <div className="space-y-2">
              {optionalFiles.map((file) => (
                <a
                  key={file.cid}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 hover:border-[#02abb8]/40 dark:border-zinc-800 dark:text-zinc-100"
                >
                  <span>{file.name}</span>
                  <span className="text-[#02abb8]">Download</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {(listing.contactEmail || listing.contactTelegram || listing.contactDiscord || listing.additionalNotes) ? (
          <div className={covenantPanelClass}>
            <DAppSectionHeader title="Project details" />
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {listing.contactEmail ? (
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email</dt>
                  <dd>
                    <a href={`mailto:${listing.contactEmail}`} className="text-[#02abb8] hover:underline">
                      {listing.contactEmail}
                    </a>
                  </dd>
                </div>
              ) : null}
              {listing.contactTelegram ? (
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Telegram</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">{listing.contactTelegram}</dd>
                </div>
              ) : null}
              {listing.contactDiscord ? (
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Discord</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">{listing.contactDiscord}</dd>
                </div>
              ) : null}
            </dl>
            {listing.additionalNotes ? (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Additional notes</p>
                <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{listing.additionalNotes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <DAppWidgetFooter dapp={dapp} hideMetaRow hideEmbed hideIcons hideStar hideHeart />

      {lightboxIndex !== null ? (
        <DirectoryGalleryLightbox
          images={galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}
