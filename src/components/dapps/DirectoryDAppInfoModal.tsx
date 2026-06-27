'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { DApp } from '@/lib/dapps';
import {
  contactXDisplayLabel,
  contactXProfileUrl,
  type DirectoryListing,
} from '@/lib/dapps/listingSubmissions';
import { getCategoryById } from '@/lib/categories';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

type DirectoryDAppInfoModalProps = {
  dapp: DApp;
  listing: DirectoryListing;
  onClose: () => void;
};

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section>
      <DAppSectionHeader title={title} />
      <div className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  );
}

function LinkList({ links }: { links: { label: string; url: string }[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={`${link.label}-${link.url}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#02abb8] hover:underline"
          >
            {link.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DirectoryDAppInfoModal({ dapp, listing, onClose }: DirectoryDAppInfoModalProps) {
  const category = getCategoryById(listing.category);

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
      name: listing.optionalFileNames[index] || 'Download',
      url: getBestGatewayUrl(cid),
    }));
    const fromUrls = (listing.optionalFileUrls ?? []).map((file) => ({
      name: file.label || 'Download',
      url: file.url,
    }));
    return [...fromCids, ...fromUrls];
  }, [listing.optionalFileCids, listing.optionalFileNames, listing.optionalFileUrls]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const networkLabel =
    listing.networkLayer === 'multichain'
      ? 'Multi'
      : listing.networkLayer === 'L1'
        ? 'L1'
        : listing.networkLayer === 'L2'
          ? 'L2'
          : listing.networkLayer;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-4 sm:px-16 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-[85vw] w-full max-h-[95vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 sm:px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">{dapp.name}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Community directory listing</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-wrap gap-2">
                {category ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {category.emoji} {category.name}
                  </span>
                ) : null}
                <span className="inline-flex items-center px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {networkLabel}
                </span>
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {listing.shortDescription ? (
                <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">{listing.shortDescription}</p>
              ) : null}

              <InfoSection title="Description">{listing.fullDescription || listing.shortDescription}</InfoSection>
              <InfoSection title="Utility">{listing.utility}</InfoSection>
              <InfoSection title="How to use">{listing.process}</InfoSection>
              <InfoSection title="Benefits">{listing.benefits}</InfoSection>
              <InfoSection title="Fees overview">{listing.feesOverview}</InfoSection>
              <InfoSection title="Pricing">{listing.feesPricing}</InfoSection>
              <InfoSection title="Costs">{listing.feesCosts}</InfoSection>

              {listing.actionButtons.length > 0 ? (
                <section>
                  <DAppSectionHeader title="Action buttons" />
                  <LinkList links={listing.actionButtons} />
                </section>
              ) : null}

              {galleryImages.length > 0 ? (
                <section>
                  <DAppSectionHeader title="Gallery" />
                  <div className="grid grid-cols-2 gap-3">
                    {galleryImages.map((image) => (
                      <a
                        key={image.url}
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
                      >
                        <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="lg:col-span-2 space-y-6">
              {listing.supportedChains.length > 0 ? (
                <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <DAppSectionHeader title="Supported chains" />
                  <div className="flex flex-wrap gap-2">
                    {listing.supportedChains.map((chain) => (
                      <span
                        key={chain}
                        className="rounded-lg bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-4">
                <DAppSectionHeader title="Links" />
                <LinkList
                  links={[
                    ...(listing.websiteUrl ? [{ label: 'Website', url: listing.websiteUrl }] : []),
                    ...listing.socialLinks,
                    ...listing.documentationLinks,
                  ]}
                />
                {!listing.websiteUrl && listing.socialLinks.length === 0 && listing.documentationLinks.length === 0 ? (
                  <p className="text-sm text-zinc-500">No links provided.</p>
                ) : null}
              </section>

              {optionalFiles.length > 0 ? (
                <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <DAppSectionHeader title="Files" />
                  <ul className="space-y-2">
                    {optionalFiles.map((file) => (
                      <li key={file.url}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#02abb8] hover:underline"
                        >
                          {file.name} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
                <DAppSectionHeader title="Contact & listing" />
                {listing.contactX ? (
                  <p className="text-sm">
                    <span className="text-zinc-500">X handle: </span>
                    <a
                      href={contactXProfileUrl(listing.contactX)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline"
                    >
                      {contactXDisplayLabel(listing.contactX)}
                    </a>
                  </p>
                ) : listing.contactEmail ? (
                  <p className="text-sm">
                    <span className="text-zinc-500">Email: </span>
                    <a href={`mailto:${listing.contactEmail}`} className="text-[#02abb8] hover:underline">
                      {listing.contactEmail}
                    </a>
                  </p>
                ) : null}
                {listing.contactTelegram ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-500">Telegram: </span>
                    {listing.contactTelegram}
                  </p>
                ) : null}
                {listing.contactDiscord ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-500">Discord: </span>
                    {listing.contactDiscord}
                  </p>
                ) : null}
                {listing.additionalNotes ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Additional notes</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{listing.additionalNotes}</p>
                  </div>
                ) : null}
                <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  Listed {new Date(listing.submittedAt).toLocaleDateString()} · {listing.feeAmountKAS} KAS listing fee (
                  {listing.paymentCurrency})
                </p>
                <p className="text-xs font-mono text-zinc-500 break-all">Submitter: {listing.submitterAddress}</p>
              </section>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
