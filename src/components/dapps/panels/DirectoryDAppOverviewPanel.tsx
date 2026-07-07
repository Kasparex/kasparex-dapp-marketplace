'use client';

import { useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import {
  contactXDisplayLabel,
  contactXProfileUrl,
  type DirectoryListing,
} from '@/lib/dapps/listingSubmissions';
import { DirectoryGalleryLightbox } from '@/components/dapps/DirectoryGalleryLightbox';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxPanel } from '@/components/kx/KxPanel';

type DirectoryDAppOverviewPanelProps = {
  dapp: DApp;
  listing: DirectoryListing;
};

function LinkGrid({ links, emptyLabel }: { links: { label: string; url: string }[]; emptyLabel?: string }) {
  if (links.length === 0) {
    return emptyLabel ? (
      <p className="kx-body">{emptyLabel}</p>
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

function normalizeTelegramUrl(handle: string): string {
  const trimmed = handle.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const user = trimmed.replace(/^@/, '');
  return `https://t.me/${user}`;
}

function normalizeDiscordUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return `https://discord.gg/${trimmed}`;
}

export function DirectoryDAppOverviewPanel({ dapp, listing }: DirectoryDAppOverviewPanelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages = useMemo(() => {
    const fromCids = listing.galleryCids.map((cid, index) => ({
      url: getBestGatewayUrl(cid),
      alt: listing.galleryFileNames[index] || `${dapp.name} screenshot ${index + 1}`,
    }));
    const fromUrls = (listing.galleryUrls ?? []).map((url, index) => ({
      url,
      alt: `${dapp.name} screenshot ${fromCids.length + index + 1}`,
    }));
    return [...fromCids, ...fromUrls];
  }, [listing.galleryCids, listing.galleryFileNames, listing.galleryUrls, dapp.name]);

  const optionalFiles = useMemo(() => {
    const fromCids = listing.optionalFileCids.map((cid, index) => ({
      cid,
      name: listing.optionalFileNames[index] || 'Download',
      url: getBestGatewayUrl(cid),
    }));
    const fromUrls = (listing.optionalFileUrls ?? []).map((file) => ({
      cid: file.url,
      name: file.label || 'Download',
      url: file.url,
    }));
    return [...fromCids, ...fromUrls];
  }, [listing.optionalFileCids, listing.optionalFileNames, listing.optionalFileUrls]);

    <div className="space-y-5">
        {listing.actionButtons.length > 0 ? (
          <KxPanel>
            <DAppSectionHeader title="Quick actions" className="mb-3" />
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
          </KxPanel>
        ) : null}

        {listing.supportedChains.length > 0 ? (
          <KxPanel>
            <DAppSectionHeader title="Supported chains" className="mb-3" />
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
          </KxPanel>
        ) : null}

        <KxPanel>
          <DAppSectionHeader title="Links" className="mb-3" />
          <LinkGrid
            links={[
              ...(listing.websiteUrl ? [{ label: 'Website', url: listing.websiteUrl }] : []),
              ...listing.socialLinks,
              ...listing.documentationLinks,
            ]}
            emptyLabel="No links provided."
          />
        </KxPanel>

        {galleryImages.length > 0 ? (
          <KxPanel>
            <DAppSectionHeader title="Gallery" className="mb-3" />
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
          </KxPanel>
        ) : null}

        {optionalFiles.length > 0 ? (
          <KxPanel>
            <DAppSectionHeader title="Files" className="mb-3" />
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
          </KxPanel>
        ) : null}

        {(listing.contactX || listing.contactEmail || listing.contactTelegram || listing.contactDiscord || listing.additionalNotes) ? (
          <KxPanel>
            <DAppSectionHeader title="Project details" className="mb-3" />
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {listing.contactX ? (
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">X handle</dt>
                  <dd>
                    <a
                      href={contactXProfileUrl(listing.contactX)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline"
                    >
                      {contactXDisplayLabel(listing.contactX)}
                    </a>
                  </dd>
                </div>
              ) : listing.contactEmail ? (
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
                  <dd>
                    <a
                      href={normalizeTelegramUrl(listing.contactTelegram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline"
                    >
                      {listing.contactTelegram}
                    </a>
                  </dd>
                </div>
              ) : null}
              {listing.contactDiscord ? (
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Discord</dt>
                  <dd>
                    <a
                      href={normalizeDiscordUrl(listing.contactDiscord)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline"
                    >
                      {listing.contactDiscord}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            {listing.additionalNotes ? (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Additional notes</p>
                <p className="whitespace-pre-wrap kx-body">{listing.additionalNotes}</p>
              </div>
            ) : null}
          </KxPanel>
        ) : null}

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
