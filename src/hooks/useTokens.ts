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
import {
  estimateTokenListingQuote,
  TOKEN_CHUNK_SIZE_BYTES,
  type TokenListingPriceQuote,
} from '@/lib/tokens/pricing';
import { createDefaultPageConfig, applyPageSectionConfig } from '@/lib/tokens/pageConfig';
import type { TokenListingNetwork } from '@/lib/tokens/listingNetwork';
import { listingNetworkToTokenNetwork } from '@/lib/tokens/listingNetwork';
import type { TokenPageSectionType } from '@/lib/tokens/listingRecord';
import {
  createPublishedListing,
  createSeedClaimListing,
  getAllPublishedListings,
  getPublishedListingById,
  getPublishedListingBySlug,
  getPublishedListingsByAuthor,
  updatePublishedListing,
  deletePublishedListing,
  mergePublishedIntoRegistry,
} from '@/lib/tokens/data';
import { getClaimableSeeds, type ClaimableSeed } from '@/lib/tokens/seedClaims';
import type { PublishedTokenListing, TokenAssetKind, TokenOnChainSnapshot, TokenNetworkEntry } from '@/lib/tokens/listingRecord';
import { listingToToken } from '@/lib/tokens/listingRecord';
import { buildCanonicalListingPayload, hashListingPayload, type TokenListingDraft } from '@/lib/tokens/publish';
import {
  buildTokenListingCommitPlainNote,
  buildTokenListingCommitPayloadHex,
  computeTokenListingRootHash,
  splitPayloadToHexChunks,
} from '@/lib/tokens/payloadHex';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { Token } from '@/lib/tokens/types';

export type CreateTokenListingInput = {
  symbol: string;
  name: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  listingNetwork?: TokenListingNetwork;
  contractAddress?: string;
  logoUrl?: string;
  logoCid?: string;
  featuredImageUrl?: string;
  featuredImageCid?: string;
  enabledModuleIds?: TokenModuleId[];
  sectionToggles?: Record<string, boolean>;
  sectionOrder?: TokenPageSectionType[];
  assetKind?: TokenAssetKind;
  deployerAddress?: string;
  maxSupply?: number;
  totalSupply?: number;
  decimals?: number;
  onChainSnapshot?: TokenOnChainSnapshot;
  networks?: TokenNetworkEntry[];
};

function buildDraft(input: CreateTokenListingInput, author: string): TokenListingDraft {
  const enabledModuleIds = input.enabledModuleIds ?? [];
  const pageConfig = input.sectionToggles || input.sectionOrder
    ? applyPageSectionConfig(
        createDefaultPageConfig(enabledModuleIds),
        input.sectionToggles ?? {},
        input.sectionOrder,
      )
    : createDefaultPageConfig(enabledModuleIds);
  return {
    symbol: input.symbol,
    name: input.name,
    description: input.description,
    shortDescription: input.shortDescription,
    tags: input.tags,
    listingNetwork: input.listingNetwork ?? 'l2_kasplex',
    contractAddress: input.contractAddress,
    logoUrl: input.logoUrl,
    logoCid: input.logoCid,
    featuredImageUrl: input.featuredImageUrl,
    featuredImageCid: input.featuredImageCid,
    pageConfig,
    enabledModuleIds,
    author,
    assetKind: input.assetKind ?? 'fictional',
    deployerAddress: input.deployerAddress,
    maxSupply: input.maxSupply,
    totalSupply: input.totalSupply,
    decimals: input.decimals,
    onChainSnapshot: input.onChainSnapshot,
    networks: input.networks,
  };
}

function listingUpdateFields(
  draft: TokenListingDraft,
  existing?: PublishedTokenListing,
) {
  return {
    symbol: draft.symbol.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    shortDescription: draft.shortDescription?.trim(),
    tags: draft.tags,
    listingNetwork: draft.listingNetwork,
    network: listingNetworkToTokenNetwork(draft.listingNetwork),
    contractAddress: draft.contractAddress?.trim(),
    logoUrl: draft.logoUrl,
    logoCid: draft.logoCid,
    featuredImageUrl: draft.featuredImageUrl,
    featuredImageCid: draft.featuredImageCid,
    pageConfig: draft.pageConfig,
    paidModuleIds: existing
      ? [...new Set([...(existing.paidModuleIds ?? []), ...draft.enabledModuleIds])]
      : draft.enabledModuleIds,
    assetKind: draft.assetKind ?? existing?.assetKind ?? 'fictional',
    deployerAddress: draft.deployerAddress?.trim() ?? existing?.deployerAddress,
    maxSupply: draft.maxSupply ?? existing?.maxSupply,
    totalSupply: draft.totalSupply ?? existing?.totalSupply,
    decimals: draft.decimals ?? existing?.decimals,
    onChainSnapshot: draft.onChainSnapshot ?? existing?.onChainSnapshot,
    networks: draft.networks ?? existing?.networks,
  };
}

function quoteForDraft(
  draft: TokenListingDraft,
  discountPercent: number,
  action: 'create' | 'edit',
  options?: { excludeModuleIds?: TokenModuleId[]; priorPricingSnapshot?: { payloadBytes: number; chunkCount: number } },
): TokenListingPriceQuote {
  return estimateTokenListingQuote({
    draft,
    action,
    discountPercent,
    moduleIds: draft.enabledModuleIds,
    excludeModuleIds: options?.excludeModuleIds,
    priorPricingSnapshot: options?.priorPricingSnapshot,
  });
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
      const canonicalPayload = buildCanonicalListingPayload(args.draft, args.op);
      const chunkHexList = splitPayloadToHexChunks(canonicalPayload, TOKEN_CHUNK_SIZE_BYTES);
      const rootHash = computeTokenListingRootHash(chunkHexList);
      const treasury = getTokensTreasuryL1Address();
      const paymentKas = Math.max(0.01, Math.ceil(args.totalKas * 100) / 100);
      const commitNote = buildTokenListingCommitPlainNote({
        listingId: args.listingId,
        op: args.op,
        chunkTotal: chunkHexList.length,
        rootHash,
        contentHash,
      });
      const commitPayload = buildTokenListingCommitPayloadHex({
        listingId: args.listingId,
        op: args.op,
        chunkTotal: chunkHexList.length,
        rootHash,
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
              chunkHexList,
              contentHash,
              rootHash,
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

      return { commitTxHash, contentHash, rootHash, chunkHexList, verified, lastError };
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

      const listingFields = {
        symbol: draft.symbol.trim().toUpperCase(),
        name: draft.name.trim(),
        description: draft.description.trim(),
        shortDescription: draft.shortDescription?.trim(),
        tags: draft.tags,
        listingNetwork: draft.listingNetwork,
        network: listingNetworkToTokenNetwork(draft.listingNetwork),
        contractAddress: draft.contractAddress?.trim(),
        logoUrl: draft.logoUrl,
        logoCid: draft.logoCid,
        featuredImageUrl: draft.featuredImageUrl,
        featuredImageCid: draft.featuredImageCid,
        pageConfig: draft.pageConfig,
        paidModuleIds: draft.enabledModuleIds,
        assetKind: draft.assetKind ?? 'fictional',
        ownership: 'none' as const,
        deployerAddress: draft.deployerAddress?.trim(),
        maxSupply: draft.maxSupply,
        totalSupply: draft.totalSupply,
        decimals: draft.decimals,
        onChainSnapshot: draft.onChainSnapshot,
        networks: draft.networks,
        listing: { verified: false, deployerVerified: false },
      };

      const listing = createPublishedListing(
        { author, ...listingFields },
        {
          listingId,
          txHash: bundle.commitTxHash,
          commitTxHash: bundle.commitTxHash,
          contentHash: bundle.contentHash,
          status: bundle.verified ? 'verified' : 'verification_pending',
          metadataCid,
          pricingSnapshot: {
            baseFeeKas: quote.baseFeeKas,
            sizeFeeKas: quote.sizeFeeKas,
            modulesFeeKas: quote.modulesFeeKas,
            networkFeeBufferKas: quote.networkFeeBufferKas,
            totalKas: quote.totalKas,
            payloadBytes: quote.payloadBytes,
            chunkCount: quote.chunkCount,
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
      const quote = quoteForDraft(draft, discountPercent, 'edit', {
        excludeModuleIds: existing.paidModuleIds,
        priorPricingSnapshot:
          existing.pricingSnapshot?.payloadBytes != null && existing.pricingSnapshot?.chunkCount != null
            ? {
                payloadBytes: existing.pricingSnapshot.payloadBytes,
                chunkCount: existing.pricingSnapshot.chunkCount,
              }
            : undefined,
      });

      if (quote.totalKas <= 0) {
        const updated = updatePublishedListing(id, listingUpdateFields(draft, existing));
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
        listingUpdateFields(draft, existing),
        {
          txHash: bundle.commitTxHash,
          commitTxHash: bundle.commitTxHash,
          contentHash: bundle.contentHash,
          status: bundle.verified ? 'verified' : 'verification_pending',
          pricingSnapshot: {
            baseFeeKas: quote.baseFeeKas,
            sizeFeeKas: quote.sizeFeeKas,
            modulesFeeKas: quote.modulesFeeKas,
            networkFeeBufferKas: quote.networkFeeBufferKas,
            totalKas: quote.totalKas,
            payloadBytes: quote.payloadBytes,
            chunkCount: quote.chunkCount,
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

  const verifyDeployer = useCallback(
    async (id: string, proof: { method: string; walletAddress: string; signature?: string }): Promise<PublishedTokenListing | null> => {
      const existing = getPublishedListingById(id);
      if (!existing) throw new Error('Listing not found');
      if (existing.ownership === 'deployer_verified') return existing;

      const verifiedNetworks = existing.networks?.length
        ? existing.networks.map((entry, index) => ({
            ...entry,
            verified: entry.primary || index === 0 ? true : entry.verified,
          }))
        : existing.listingNetwork
          ? [
              {
                network: existing.listingNetwork,
                contractAddress: existing.contractAddress,
                primary: true,
                verified: true,
              },
            ]
          : undefined;

      const updated = updatePublishedListing(id, {
        ownership: 'deployer_verified',
        status: existing.status === 'draft' ? 'published' : existing.status,
        listing: { ...(existing.listing ?? {}), verified: true, deployerVerified: true },
        networks: verifiedNetworks,
        ownershipProof: {
          method: proof.method,
          walletAddress: proof.walletAddress,
          signature: proof.signature,
          verifiedAt: new Date().toISOString(),
        },
      });

      const idKey = `ktl:deployer:${id}:${proof.signature ? proof.signature.slice(0, 24) : proof.walletAddress}`;
      appendHubActivityEarn({
        walletRaw: proof.walletAddress,
        source: 'token_listing_verify',
        redeemableDelta: HUB_EARN_POINTS.tokenListingVerify,
        krexBalance,
        idempotencyKey: idKey,
        meta: { listingId: existing.listingId, id, method: proof.method },
      });

      loadListings();
      return updated;
    },
    [krexBalance, loadListings],
  );

  const assignWallet = useCallback(
    async (id: string, proof: { method: string; walletAddress: string; signature?: string }): Promise<PublishedTokenListing | null> => {
      const existing = getPublishedListingById(id);
      if (!existing) throw new Error('Listing not found');
      if (existing.ownership === 'deployer_verified') return existing;

      const updated = updatePublishedListing(id, {
        ownership: 'wallet_assigned',
        listing: { ...(existing.listing ?? {}), verified: false, deployerVerified: false },
        ownershipProof: {
          method: proof.method,
          walletAddress: proof.walletAddress,
          signature: proof.signature,
          verifiedAt: new Date().toISOString(),
        },
      });

      loadListings();
      return updated;
    },
    [loadListings],
  );

  const unassignWallet = useCallback(
    async (id: string): Promise<PublishedTokenListing | null> => {
      const existing = getPublishedListingById(id);
      if (!existing) throw new Error('Listing not found');
      if (existing.ownership === 'deployer_verified') {
        throw new Error('Deployer-verified listings cannot be unassigned.');
      }

      const updated = updatePublishedListing(id, {
        ownership: 'none',
        ownershipProof: undefined,
        listing: { ...(existing.listing ?? {}), verified: false, deployerVerified: false },
      });

      loadListings();
      return updated;
    },
    [loadListings],
  );

  const getClaimableSeedsForWallet = useCallback(
    (walletAddress: string | null | undefined): ClaimableSeed[] => {
      const claimable = getClaimableSeeds(walletAddress);
      // Hide any seed that is already claimed (a published listing exists for its slug).
      return claimable.filter((seed) => !getPublishedListingBySlug(seed.slug));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listings],
  );

  const claimSeedToken = useCallback(
    async (seed: ClaimableSeed, author: string): Promise<PublishedTokenListing> => {
      const listing = createSeedClaimListing(seed.token, author, {
        ownership: seed.coin ? 'wallet_assigned' : 'deployer_verified',
      });
      loadListings();
      return listing;
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
    verifyDeployer,
    assignWallet,
    unassignWallet,
    getClaimableSeedsForWallet,
    claimSeedToken,
    resolveToken,
    discountPercent,
  };
}
