'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppIcon } from './DAppIcon';
import { DAppNetworkBadge } from './DAppNetworkBadge';
import { DAppPageHeaderActions, useMergedDApp } from './DAppPageHeaderActions';
import { KxTagChip } from '@/components/ui/KxTagChip';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { resolveDAppAuthor } from '@/lib/dapps/deployer';
import { KxBadge } from '@/components/ui/KxBadge';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { KX_DETAIL_HEADER } from '@/lib/hub/shellTokens';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

function SocialLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-[#02abb8]/40 hover:text-[#02abb8] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export function DAppPageHeader({
  dapp,
  contractAddress,
  listing,
}: {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
}) {
  const router = useRouter();
  const { mergedDApp } = useMergedDApp(dapp, contractAddress);
  const category = getCategoryById(mergedDApp.category);
  const { wallet: authorWallet, name: authorCustomName } = resolveDAppAuthor(mergedDApp);

  const featuredImage = mergedDApp.featuredImage || mergedDApp.image || null;
  const links = mergedDApp.developerLinks ?? [];
  const websiteFromListing = listing?.websiteUrl?.trim();
  const allLinks = websiteFromListing
    ? [{ label: 'Website', url: websiteFromListing }, ...links.filter((l) => l.url !== websiteFromListing)]
    : links;

  const excerpt =
    listing?.shortDescription?.trim() ||
    mergedDApp.utility?.trim() ||
    mergedDApp.description?.trim() ||
    '';

  const statusLabel = mergedDApp.status || 'Mainnet';

  return (
    <div id="dapp-header" className={`${KX_DETAIL_HEADER} relative mb-8 scroll-mt-24 select-text`}>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />

      <div className="relative flex min-h-[320px] flex-col lg:min-h-[360px] lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <div className="mb-5 flex items-start gap-4">
            <DAppIcon
              dAppName={mergedDApp.name}
              category={mergedDApp.category}
              dapp={mergedDApp}
              size={72}
              className="flex-shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                {mergedDApp.name}
              </h1>
              {authorWallet ? (
                <AuthorInline address={authorWallet} displayName={authorCustomName} className="mt-2" />
              ) : mergedDApp.developer ? (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">by {mergedDApp.developer}</p>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
              <DAppNetworkBadge dapp={mergedDApp} preferRequired size="sm" />
              <KxBadge variant="zinc">{statusLabel}</KxBadge>
            </div>
          </div>

          {excerpt ? (
            <p className="kx-body mb-5 max-w-2xl select-text">{excerpt}</p>
          ) : null}

          {allLinks.length > 0 ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {allLinks.map((link) => (
                <SocialLink key={`${link.label}-${link.url}`} label={link.label} url={link.url} />
              ))}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {mergedDApp.tags?.map((tag) => (
              <KxTagChip key={tag} label={tag} prefix="" />
            ))}
            {category ? (
              <KxListingCategoryChip
                icon={category.emoji}
                onClick={() => router.push(`/dapps?category=${encodeURIComponent(mergedDApp.category)}`)}
                title={`Browse ${category.name}`}
              >
                {category.name}
              </KxListingCategoryChip>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-[220px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={mergedDApp.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <KxListingFeaturedPlaceholder className="min-h-[220px] lg:min-h-full" iconClassName="h-16 w-16" />
          )}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <div className="rounded-xl border border-zinc-200 bg-white/90 p-1 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <DAppPageHeaderActions dapp={mergedDApp} contractAddress={contractAddress} />
        </div>
      </div>
    </div>
  );
}
