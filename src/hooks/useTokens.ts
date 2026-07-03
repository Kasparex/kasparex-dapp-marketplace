'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { kasToSompi } from '@/lib/ads/config';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { TOKEN_MODULE_OFFERS, type TokenModuleId } from '@/lib/tokens/modules';
import { estimateTokenPageQuote, TOKEN_LISTING_FEES } from '@/lib/tokens/pricing';
import { createDefaultPageConfig } from '@/lib/tokens/pageConfig';
import {
  createPublishedListing,
  getAllPublishedListings,
  getPublishedListingById,
  getPublishedListingBySlug,
  getPublishedListingsByAuthor,
  updatePublishedListing,
  deletePublishedListing,
  mergePublishedIntoRegistry,
} from '@/lib/tokens/data';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { listingToToken } from '@/lib/tokens/listingRecord';
import { buildCanonicalListingPayload, hashListingPayload, type TokenListingDraft } from '@/lib/tokens/publish';
import {
  buildTokenListingCommitPlainNote,
  buildTokenListingCommitPayloadHex,
} from '@/lib/tokens/payloadHex';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { Token } from '@/lib/tokens/types';
import type { TokenNetwork } from '@/lib/tokens/types';

export type CreateTokenListingInput = {
  symbol: string;
  name: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  network?: TokenNetwork;
  contractAddress?: string;
  enabledModuleIds?: TokenModuleId[];
  sectionToggles?: Record<string, boolean>;
};

function buildDraft(input: CreateTokenListingInput, author: string): TokenListingDraft {
  const enabledModuleIds = input.enabledModuleIds ?? [];
  const pageConfig = createDefaultPageConfig(enabledModuleIds);
  if (input.sectionToggles) {
    pageConfig.sections = pageConfig.sections.map((section) => ({
      ...section,
      enabled: input.sectionToggles?.[section.type] ?? section.enabled,
    }));
  }
  return {
    symbol: input.symbol,
    name: input.name,
    description: input.description,
    shortDescription: input.shortDescription,
    tags: input.tags,
    network: input.network ?? 'L2',
    contractAddress: input.contractAddress,
    pageConfig,
    enabledModuleIds,
    author,
  };
}

function quoteForDraft(draft: TokenListingDraft, discountPercent: number, action: 'create' | 'edit') {
  const modulePriceById = Object.fromEntries(TOKEN_MODULE_OFFERS.map((o) => [o.id, o.unlockPriceKas]));
  const quote = estimateTokenPageQuote({
    baseFeeKas: action === 'edit' ? TOKEN_LISTING_FEES.updateListingKas : TOKEN_LISTING_FEES.createListingKas,
    moduleIds: draft.enabledModuleIds,
    modulePriceById,
  });
  const subtotal = quote.baseFeeKas + quote.modulesFeeKas + quote.networkFeeBufferKas;
  const discountKas = (subtotal * discountPercent) / 100;
  const totalKas = Math.round((subtotal - discountKas) * 100) / 100;
  return { ...quote, subtotalKas: subtotal, discountKas, totalKas };
}

export function useTokens() {
  const [listings, setListings] = useState<PublishedTokenListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state: kaspaState } = useKaspaWallet();
  const { tier, balance: krexBalance } = useKREXBalance();
  const discountPercent = krexTierDiscountPercent(tier);

  const loadListings = useCallback(() => {
    setIsLoading(true);
    try {
      setListings(getAllPublishedListings());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') loadListings();
  }, [loadListings]);

  const getListingBySlug = useCallback((slug: string) => getPublishedListingBySlug(slug), []);

  const getAuthorListings = useCallback(
    (author: string) => getPublishedListingsByAuthor(author),
    [],
  );

  const getMergedTokens = useCallback(
    (baseTokens: Token[]) => mergePublishedIntoRegistry(baseTokens),
    [],
  );

  const sendListingTx = useCallback(
    async (args: {
      listingId: string;
      op: 'create' | 'edit';
      author: string;
      draft: TokenListingDraft;
      totalKas: number;
    }) => {
      if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
        throw new Error('Kaspa wallet must be connected to publish token listings.');
      }
      const contentHash = hashListingPayload(args.draft, args.op);
      const treasury = getTokensTreasuryL1Address();
      const paymentKas = Math.max(0.01, Math.ceil(args.totalKas * 100) / 100);
      const commitNote = buildTokenListingCommitPlainNote({
        listingId: args.listingId,
        op: args.op,
        contentHash,
      });
      const commitPayload = buildTokenListingCommitPayloadHex({
        listingId: args.listingId,
        op: args.op,
        contentHash,
      });
      const commitTx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: treasury,
        amount: String(kasToSompi(paymentKas)),
        note: commitNote,
        payload: commitPayload,
      });
      if (commitTx.status === 'failed' || !commitTx.txHash) {
        throw new Error(commitTx.error ?? 'Payment transaction failed');
      }
      const commitTxHash = extractKaspaTransactionId(commitTx.txHash) ?? commitTx.txHash;

      let verified = false;
      let lastError = 'Verification failed.';
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const verifyRes = await fetch('/api/tokens/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listingId: args.listingId,
              op: args.op,
              payerAddress: args.author,
              commitTxHash,
              contentHash,
              requiredTotalKas: args.totalKas,
            }),
          });
          const verifyJson = (await verifyRes.json()) as { ok?: boolean; error?: string };
          if (verifyJson.ok) {
            verified = true;
            break;
          }
          lastError = verifyJson.error ?? lastError;
        } catch {
          lastError = 'Verification endpoint unavailable.';
        }
        if (attempt < 9) {
          await new Promise((r) => setTimeout(r, 1400 + attempt * 450));
        }
      }

      return { commitTxHash, contentHash, verified, lastError };
    },
    [kaspaState.address, kaspaState.isConnected, kaspaState.provider],
  );

  const publishNewListing = useCallback(
    async (input: CreateTokenListingInput, author: string): Promise<PublishedTokenListing> => {
      const draft = buildDraft(input, author);
      const listingId = `ktl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const quote = quoteForDraft(draft, discountPercent, 'create');

      let metadataCid: string | undefined;
      try {
        const { getIPFSClient } = await import('@/lib/ipfs/client');
        const client = getIPFSClient();
        const payload = buildCanonicalListingPayload(draft, 'create');
        metadataCid = await client.uploadJSON(JSON.parse(payload), {
          filename: `Token Listings/${listingId}/manifest.json`,
        });
      } catch {
        /* IPFS optional */
      }

      const bundle = await sendListingTx({
        listingId,
        op: 'create',
        author,
        draft,
        totalKas: quote.totalKas,
      });

      const listing = createPublishedListing(
        {
          author,
          symbol: draft.symbol.trim().toUpperCase(),
          name: draft.name.trim(),
          description: draft.description.trim(),
          shortDescription: draft.shortDescription?.trim(),
          tags: draft.tags,
          network: draft.network,
          contractAddress: draft.contractAddress?.trim(),
          pageConfig: draft.pageConfig,
          paidModuleIds: draft.enabledModuleIds,
        },
        {
          listingId,
          txHash: bundle.commitTxHash,
          commitTxHash: bundle.commitTxHash,
          contentHash: bundle.contentHash,
          status: bundle.verified ? 'verified' : 'verification_pending',
          metadataCid,
          pricingSnapshot: {
            baseFeeKas: quote.baseFeeKas,
            modulesFeeKas: quote.modulesFeeKas,
            networkFeeBufferKas: quote.networkFeeBufferKas,
            totalKas: quote.totalKas,
          },
        },
      );

      if (bundle.verified && bundle.commitTxHash) {
        appendHubActivityEarn({
          walletRaw: author,
          source: 'token_listing_create',
          redeemableDelta: HUB_EARN_POINTS.tokenListingCreate,
          krexBalance,
          idempotencyKey: `ktl:create:${bundle.commitTxHash}`,
          meta: { listingId, slug: listing.slug },
        });
      }

      loadListings();
      return listing;
    },
    [discountPercent, krexBalance, loadListings, sendListingTx],
  );

  const updateExistingListing = useCallback(
    async (id: string, input: CreateTokenListingInput, author: string): Promise<PublishedTokenListing | null> => {
      const existing = getPublishedListingById(id);
      if (!existing) throw new Error('Listing not found');

      const draft = buildDraft(input, author);
      const listingId = existing.listingId;
      const quote = quoteForDraft(draft, discountPercent, 'edit');

      if (quote.totalKas <= 0) {
        const updated = updatePublishedListing(id, {
          symbol: draft.symbol.trim().toUpperCase(),
          name: draft.name.trim(),
          description: draft.description.trim(),
          shortDescription: draft.shortDescription?.trim(),
          tags: draft.tags,
          network: draft.network,
          contractAddress: draft.contractAddress?.trim(),
          pageConfig: draft.pageConfig,
          paidModuleIds: [
            ...new Set([...(existing.paidModuleIds ?? []), ...draft.enabledModuleIds]),
          ],
        });
        loadListings();
        return updated;
      }

      const bundle = await sendListingTx({
        listingId,
        op: 'edit',
        author,
        draft,
        totalKas: quote.totalKas,
      });

      const updated = updatePublishedListing(
        id,
        {
          symbol: draft.symbol.trim().toUpperCase(),
          name: draft.name.trim(),
          description: draft.description.trim(),
          shortDescription: draft.shortDescription?.trim(),
          tags: draft.tags,
          network: draft.network,
          contractAddress: draft.contractAddress?.trim(),
          pageConfig: draft.pageConfig,
          paidModuleIds: [
            ...new Set([...(existing.paidModuleIds ?? []), ...draft.enabledModuleIds]),
          ],
        },
        {
          txHash: bundle.commitTxHash,
          commitTxHash: bundle.commitTxHash,
          contentHash: bundle.contentHash,
          status: bundle.verified ? 'verified' : 'verification_pending',
          pricingSnapshot: {
            baseFeeKas: quote.baseFeeKas,
            modulesFeeKas: quote.modulesFeeKas,
            networkFeeBufferKas: quote.networkFeeBufferKas,
            totalKas: quote.totalKas,
          },
        },
      );

      if (bundle.verified && bundle.commitTxHash) {
        appendHubActivityEarn({
          walletRaw: author,
          source: 'token_listing_update',
          redeemableDelta: HUB_EARN_POINTS.tokenListingUpdate,
          krexBalance,
          idempotencyKey: `ktl:update:${bundle.commitTxHash}`,
          meta: { listingId, id },
        });
      }

      loadListings();
      return updated;
    },
    [discountPercent, krexBalance, loadListings, sendListingTx],
  );

  const removeListing = useCallback(
    async (id: string): Promise<boolean> => {
      const ok = deletePublishedListing(id);
      if (ok) loadListings();
      return ok;
    },
    [loadListings],
  );

  const resolveToken = useCallback(
    (slug: string, baseToken?: Token | null): Token | null => {
      if (baseToken) return baseToken;
      const listing = getPublishedListingBySlug(slug);
      if (!listing) return null;
      if (
        listing.status !== 'verified' &&
        listing.status !== 'published' &&
        listing.status !== 'verification_pending'
      ) {
        return null;
      }
      return listingToToken(listing);
    },
    [],
  );

  return {
    listings,
    isLoading,
    loadListings,
    getListingBySlug,
    getAuthorListings,
    getMergedTokens,
    publishNewListing,
    updateExistingListing,
    removeListing,
    resolveToken,
    discountPercent,
  };
}
