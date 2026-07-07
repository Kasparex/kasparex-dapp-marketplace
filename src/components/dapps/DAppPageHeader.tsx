'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { KxListingDetailHeader } from '@/components/kx/KxListingDetailHeader';
import { DAppIcon } from './DAppIcon';
import { DAppNetworkBadge } from './DAppNetworkBadge';
import { DAppPageHeaderActions, useMergedDApp } from './DAppPageHeaderActions';
import { KxTagChip } from '@/components/ui/KxTagChip';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { resolveDAppAuthor } from '@/lib/dapps/deployer';
import { KxBadge } from '@/components/ui/KxBadge';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

function SocialLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[#02abb8]/40 hover:text-[#02abb8] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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

  const statusLabel = mergedDApp.status || 'Mainnet';

  const chipsRow = (
    <>
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
    </>
  );

  const linksRow =
    allLinks.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {allLinks.map((link) => (
          <SocialLink key={`${link.label}-${link.url}`} label={link.label} url={link.url} />
        ))}
      </div>
    ) : null;

  return (
    <KxListingDetailHeader
      id="dapp-header"
      compact
      logo={
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          dapp={mergedDApp}
          size={56}
          className="rounded-xl"
        />
      }
      titleBlock={
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-tight sm:text-2xl">
            {mergedDApp.name}
          </h1>
          {authorWallet ? (
            <AuthorInline
              address={authorWallet}
              displayName={authorCustomName}
              className="mt-1.5"
            />
          ) : mergedDApp.developer ? (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">by {mergedDApp.developer}</p>
          ) : null}
        </div>
      }
      topRight={
        <div className="flex flex-col items-end gap-1.5">
          <DAppNetworkBadge dapp={mergedDApp} preferRequired size="sm" />
          <KxBadge variant="zinc">{statusLabel}</KxBadge>
        </div>
      }
      linksRow={linksRow}
      chipsRow={chipsRow}
      footerRow={<DAppPageHeaderActions dapp={mergedDApp} contractAddress={contractAddress} />}
      featuredImageUrl={featuredImage}
      featuredAlt={mergedDApp.name}
    />
  );
}
