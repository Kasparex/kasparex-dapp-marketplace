'use client';

import { useMemo } from 'react';
import type { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

type DirectoryDAppProfileProps = {
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

export function DirectoryDAppProfile({ dapp, listing }: DirectoryDAppProfileProps) {
  const category = getCategoryById(listing.category);

  const galleryUrls = useMemo(
    () => listing.galleryCids.map((cid) => getBestGatewayUrl(cid)),
    [listing.galleryCids],
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

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          {category ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
              {category.emoji} {category.name}
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Community listing
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            {listing.networkLayer === 'multichain' ? 'Multichain' : `${listing.networkLayer} layer`}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-3">{dapp.name}</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">{listing.shortDescription}</p>

        {listing.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-5">
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {listing.actionButtons.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Actions</h2>
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
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Overview</h2>
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {listing.fullDescription || listing.shortDescription}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-3">Utility</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{listing.utility || '—'}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-3">Supported chains</h2>
          {listing.supportedChains.length > 0 ? (
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {listing.supportedChains.map((chain) => (
                <li key={chain}>{chain}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">{dapp.network}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Links</h2>
          <LinkGrid
            links={[
              ...(listing.websiteUrl
                ? [{ label: 'Website', url: listing.websiteUrl }]
                : []),
              ...listing.socialLinks,
              ...listing.documentationLinks,
            ]}
            emptyLabel="No links provided."
          />
        </div>
      </section>

      {galleryUrls.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryUrls.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <img
                  src={url}
                  alt={listing.galleryFileNames[index] || `${dapp.name} screenshot ${index + 1}`}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {optionalFiles.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Files</h2>
          <div className="space-y-2">
            {optionalFiles.map((file) => (
              <a
                key={file.cid}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:border-[#02abb8]/40"
              >
                <span>{file.name}</span>
                <span className="text-[#02abb8]">Download</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {(listing.contactEmail || listing.contactTelegram || listing.contactDiscord || listing.additionalNotes) ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Project details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {listing.contactEmail ? (
              <div>
                <dt className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider mb-1">Email</dt>
                <dd>
                  <a href={`mailto:${listing.contactEmail}`} className="text-[#02abb8] hover:underline">
                    {listing.contactEmail}
                  </a>
                </dd>
              </div>
            ) : null}
            {listing.contactTelegram ? (
              <div>
                <dt className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider mb-1">Telegram</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{listing.contactTelegram}</dd>
              </div>
            ) : null}
            {listing.contactDiscord ? (
              <div>
                <dt className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider mb-1">Discord</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{listing.contactDiscord}</dd>
              </div>
            ) : null}
          </dl>
          {listing.additionalNotes ? (
            <div>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider mb-2">Additional notes</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{listing.additionalNotes}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
