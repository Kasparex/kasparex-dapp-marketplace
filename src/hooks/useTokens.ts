'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { type StorePaymentCurrency } from '@/lib/store/currencies';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import { KREX_DECIMALS } from '@/lib/game/diamond-veins-config';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import type { TokenOwnershipProof, TokenOwnershipStatus } from '@/lib/tokens/listingRecord';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { TOKEN_MODULE_OFFERS, type TokenModuleId } from '@/lib/tokens/modules';
import { filterModulesForAssetKind } from '@/lib/tokens/utilityEligibility';
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
import type { TokenModulesConfig } from '@/lib/tokens/modules';
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
import {
  bootstrapHubContent,
  syncHubContentItem,
  onHubContentVisibilityRefresh,
} from '@/lib/hub/contentSync';
import { executeHubPaidDelete, HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { collectTokenMediaCids } from '@/lib/ipfs/cidUtils';

export type CreateTokenListingInput = {
  symbol: string;
  name: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  category?: string;
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
  modulesConfig?: TokenModulesConfig;
  paymentCurrency?: StorePaymentCurrency;
  /** Deployer ownership proof collected in the form before publish. */
  ownershipProof?: TokenOwnershipProof;
  ownership?: TokenOwnershipStatus;
};

function buildDraft(input: CreateTokenListingInput, author: string): TokenListingDraft {
  const assetKind = input.assetKind ?? 'real';
  const enabledModuleIds = filterModulesForAssetKind(input.enabledModuleIds ?? [], assetKind);
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
    category: input.category,
    listingNetwork: input.listingNetwork ?? 'l2_kasplex',
    contractAddress: input.contractAddress,
    logoUrl: input.logoUrl,
    logoCid: input.logoCid,
    featuredImageUrl: input.featuredImageUrl,
    featuredImageCid: input.featuredImageCid,
    pageConfig,
    enabledModuleIds,
    author,
    assetKind,
    deployerAddress: input.deployerAddress,
    maxSupply: input.maxSupply,
    totalSupply: input.totalSupply,
    decimals: input.decimals,
    onChainSnapshot: input.onChainSnapshot,
    networks: input.networks,
    modulesConfig: input.modulesConfig,
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
    category: draft.category,
    listingNetwork: draft.listingNetwork,
    network: listingNetworkToTokenNetwork(draft.listingNetwork),
    contractAddress: draft.contractAddress?.trim(),
    logoUrl: draft.logoUrl,
    logoCid: draft.logoCid,
    featuredImageUrl: draft.featuredImageUrl,
    featuredImageCid: draft.featuredImageCid,
    pageConfig: draft.pageConfig,
    paidModuleIds: filterModulesForAssetKind(
      existing
        ? [...new Set([...(existing.paidModuleIds ?? []), ...draft.enabledModuleIds])]
        : draft.enabledModuleIds,
      draft.assetKind ?? existing?.assetKind ?? 'real',
    ),
    assetKind: draft.assetKind ?? existing?.assetKind ?? 'real',
    deployerAddress: draft.deployerAddress?.trim() ?? existing?.deployerAddress,
    maxSupply: draft.maxSupply ?? existing?.maxSupply,
    totalSupply: draft.totalSupply ?? existing?.totalSupply,
    decimals: draft.decimals ?? existing?.decimals,
    onChainSnapshot: draft.onChainSnapshot ?? existing?.onChainSnapshot,
    networks: draft.networks ?? existing?.networks,
    modulesConfig: draft.modulesConfig ?? existing?.modulesConfig,
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
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);
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
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const bootstrap = async () => {
      await bootstrapHubContent(['tokens']);
      if (!cancelled) loadListings();
    };

    void bootstrap();
    const onUpdate = () => loadListings();
    window.addEventListener('tokens-listings-updated', onUpdate);
    const stopVisibility = onHubContentVisibilityRefresh(() => loadListings(), ['tokens']);
    return () => {
      cancelled = true;
      window.removeEventListener('tokens-listings-updated', onUpdate);
      stopVisibility();
    };
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
      paymentCurrency?: StorePaymentCurrency;
    }) => {
      if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
        throw new Error('Kaspa wallet must be connected to publish token listings.');
      }
      const contentHash = hashListingPayload(args.draft, args.op);
      const canonicalPayload = buildCanonicalListingPayload(args.draft, args.op);
      const chunkHexList = splitPayloadToHexChunks(canonicalPayload, TOKEN_CHUNK_SIZE_BYTES);
      const rootHash = computeTokenListingRootHash(chunkHexList);
      const treasury = getTokensTreasuryL1Address().replace(/^kaspa:/, '');
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

      let commitTxHash: string;
      let paymentTxHashes: string[] | undefined;
      const currencyId = String(args.paymentCurrency || 'KAS').trim();
      if (currencyId.startsWith('kcc20:')) {
        throw new Error(
          'KCC-20 Hub fee settlement is enabling next. Pay with KAS, KREX, or a KRC-20 for now.',
        );
      }
      if (currencyId === 'KREX' || (currencyId !== 'KAS' && !currencyId.startsWith('kcc20:'))) {
        const tick = currencyId === 'KREX' ? 'KREX' : currencyId.toUpperCase();
        const amount = resolveTokenAmountFromKas(paymentKas, tick, pricingSnapshot);
        if (tick === 'KREX' && krexBalance + 1e-12 < amount) {
          throw new Error('Insufficient KREX balance for listing payment');
        }
        commitTxHash = await transferKrc20(kaspaState.provider as KaspaWalletProvider, {
          tick,
          amount,
          to: treasury,
          decimals: tick === 'KREX' ? KREX_DECIMALS : 8,
        });
      } else {
        const plan = buildHubPlatformFeePlan({
          totalKas: paymentKas,
          treasuryAddress: getTokensTreasuryL1Address(),
          note: commitNote,
          payloadHex: commitPayload,
        });
        const paid = await payKasPaymentPlan(
          kaspaState.provider as KaspaWalletProvider,
          plan,
          kaspaState.address,
        );
        // Atomic: one tx. Sequential: treasury+payload first (txHash), then rewards extras.
        commitTxHash = extractKaspaTransactionId(paid.txHash) ?? paid.txHash;
        paymentTxHashes = paid.extraTxHashes?.length
          ? [commitTxHash, ...paid.extraTxHashes]
          : undefined;
      }

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
              paymentTxHashes,
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
    [kaspaState.address, kaspaState.isConnected, kaspaState.provider, krexBalance, pricingSnapshot],
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
        paymentCurrency: input.paymentCurrency,
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
        modulesConfig: draft.modulesConfig,
        assetKind: draft.assetKind ?? 'real',
        ownership: (input.ownershipProof ? 'deployer_verified' : input.ownership ?? 'none') as TokenOwnershipStatus,
        ownershipProof: input.ownershipProof,
        deployerAddress: draft.deployerAddress?.trim(),
        maxSupply: draft.maxSupply,
        totalSupply: draft.totalSupply,
        decimals: draft.decimals,
        onChainSnapshot: draft.onChainSnapshot,
        networks: (draft.networks ?? []).map((entry) => ({
          ...entry,
          verified:
            Boolean(input.ownershipProof) &&
            (entry.primary || entry.network === draft.listingNetwork || Boolean(entry.verified)),
        })),
        listing: {
          verified: Boolean(input.ownershipProof),
          deployerVerified: Boolean(input.ownershipProof),
        },
      };

      const listing = createPublishedListing(
        { author, ...listingFields },
        {
          listingId,
          txHash: bundle.commitTxHash,
          commitTxHash: bundle.commitTxHash,
          contentHash: bundle.contentHash,
          status: bundle.verified ? 'verified' : 'payment_pending',
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

      void syncHubContentItem('tokens', 'upsert', { item: listing, commitTxHash: bundle.commitTxHash });
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
        if (updated) void syncHubContentItem('tokens', 'upsert', { item: updated });
        loadListings();
        return updated;
      }

      const bundle = await sendListingTx({
        listingId,
        op: 'edit',
        author,
        draft,
        totalKas: quote.totalKas,
        paymentCurrency: input.paymentCurrency,
      });

      const updated = updatePublishedListing(
        id,
        listingUpdateFields(draft, existing),
        {
          txHash: bundle.commitTxHash,
          commitTxHash: bundle.commitTxHash,
          contentHash: bundle.contentHash,
          status: bundle.verified ? 'verified' : 'payment_pending',
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

      if (updated) {
        void syncHubContentItem('tokens', 'upsert', { item: updated, commitTxHash: bundle.commitTxHash });
      }

      loadListings();
      return updated;
    },
    [discountPercent, krexBalance, loadListings, sendListingTx],
  );

  const removeListing = useCallback(
    async (id: string): Promise<boolean> => {
      const existing = getPublishedListingById(id);
      if (!existing) return false;
      if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
        throw new Error('Kaspa wallet must be connected to delete a token listing.');
      }

      const result = await executeHubPaidDelete({
        kind: 'tokens',
        id,
        feeKas: HUB_DELETE_FEE_KAS.tokens,
        treasuryAddress: getTokensTreasuryL1Address(),
        payerProvider: kaspaState.provider as KaspaWalletProvider,
        payerAddress: kaspaState.address,
        mediaCids: collectTokenMediaCids(existing),
        removeLocal: () => deletePublishedListing(id),
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Delete failed');
      }

      loadListings();
      return true;
    },
    [kaspaState.address, kaspaState.isConnected, kaspaState.provider, loadListings],
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
        listing.status !== 'payment_pending' && listing.status !== 'verification_pending'
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
