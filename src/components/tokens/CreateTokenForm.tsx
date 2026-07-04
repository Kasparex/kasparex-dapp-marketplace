'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { Krc20TickerSearchField } from '@/components/tokens/Krc20TickerSearchField';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { TokenPreviewModal } from '@/components/tokens/TokenPreviewModal';
import { TokenPageBuilder } from '@/components/tokens/TokenPageBuilder';
import { TokenCategoryField } from '@/components/tokens/TokenCategoryField';
import {
  resolveTokenListingMedia,
  TokenListingMediaPanel,
  type TokenListingMediaState,
} from '@/components/tokens/TokenListingMediaPanel';
import { TOKEN_MODULE_OFFERS, type TokenModuleId, getTokenModuleDiscountPercent, formatTokenModulePaymentLabel, type TokenModulesConfig } from '@/lib/tokens/modules';
import { filterModulesForAssetKind, isIntegrationModule } from '@/lib/tokens/utilityEligibility';
import { estimateTokenListingQuote } from '@/lib/tokens/pricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { TokenModuleConfigFields } from '@/components/tokens/TokenModuleConfigFields';
import { STORE_PAYMENT_CURRENCIES, type StorePaymentCurrency } from '@/lib/store/currencies';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { Token } from '@/lib/tokens/types';
import type { PublishedTokenListing, TokenAssetKind, TokenOnChainSnapshot, TokenNetworkEntry, TokenPageSectionType } from '@/lib/tokens/listingRecord';
import { createDefaultPageConfig, applyPageSectionConfig, OVERVIEW_CANVAS_BLOCKS } from '@/lib/tokens/pageConfig';
import { TOKEN_LISTING_NETWORK_OPTIONS } from '@/lib/tokens/listingNetwork';
import type { TokenListingNetwork } from '@/lib/tokens/listingNetwork';
import { listingNetworkToTokenNetwork, tokenNetworkToListingNetwork } from '@/lib/tokens/listingNetwork';
import { TOKEN_CONTENT_LIMITS, getTokenCharacterCount } from '@/lib/tokens/limits';
import { KxFormDropdown } from '@/components/ui/KxFormDropdown';
import type { TokenListingDraft } from '@/lib/tokens/publish';
import { contentForRichEditor } from '@/lib/richText/html';
import { useTokens } from '@/hooks/useTokens';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { Alert } from '@/components/Alert';
import type { Krc20TokenInfo } from '@/lib/tokens/krc20Lookup';
import { fetchL2TokenInfo, formatL2Supply } from '@/lib/tokens/l2TokenLookup';
import { formatKrc20Supply } from '@/lib/tokens/krc20Lookup';
import {
  buildNetworkEntries,
  getNetworkAddressPlaceholder,
  getSecondaryNetworkOptions,
} from '@/lib/tokens/networks';

const FORM_PANEL_CLASS =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm';

const PREMIUM_MODULE_CARD_CLASS =
  'rounded-2xl border-2 border-dashed border-amber-400/60 dark:border-amber-300/40 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-500/[0.08] dark:to-zinc-900 p-5 sm:p-6 shadow-sm space-y-4';

const PAGE_SECTION_TYPES: TokenPageSectionType[] = [
  'overview',
  'tokenomics',
  'roadmap',
  'markets',
  'swap',
  'utility',
  'comments',
  'links',
  'whitepaper',
];

type SecondaryNetworkRow = {
  id: string;
  network: TokenListingNetwork;
  contractAddress: string;
};

function initSecondaryNetworks(listing?: PublishedTokenListing | null): SecondaryNetworkRow[] {
  if (!listing?.networks?.length) return [];
  return listing.networks
    .filter((n) => !n.primary)
    .map((n, i) => ({
      id: `sec-${i}-${n.network}`,
      network: n.network,
      contractAddress: n.contractAddress ?? '',
    }));
}

interface CreateTokenFormProps {
  listing?: PublishedTokenListing | null;
  media: TokenListingMediaState;
  onMediaChange: (next: TokenListingMediaState) => void;
  onSuccess?: (listing: PublishedTokenListing) => void;
  onCancelEdit?: () => void;
}

function parseSupplyNumber(raw: string | undefined, decimals: number): number | undefined {
  if (!raw) return undefined;
  try {
    const n = BigInt(raw);
    const divisor = BigInt(10 ** Math.min(decimals, 18));
    return Number(n / divisor);
  } catch {
    return undefined;
  }
}

function buildFormDraft(args: {
  symbol: string;
  name: string;
  description: string;
  shortDescription: string;
  tags: string[];
  category: string;
  listingNetwork: TokenListingNetwork;
  contractAddress: string;
  media: TokenListingMediaState;
  enabledModuleIds: TokenModuleId[];
  sectionToggles: Record<string, boolean>;
  sectionOrder: TokenPageSectionType[];
  author: string;
  assetKind: TokenAssetKind;
  deployerAddress?: string;
  maxSupply?: number;
  totalSupply?: number;
  decimals?: number;
  onChainSnapshot?: TokenOnChainSnapshot;
  networks?: TokenNetworkEntry[];
  modulesConfig?: TokenModulesConfig;
}): TokenListingDraft {
  const resolved = resolveTokenListingMedia(args.media);
  const pageConfig = applyPageSectionConfig(
    createDefaultPageConfig(args.enabledModuleIds),
    args.sectionToggles,
    args.sectionOrder,
  );
  return {
    symbol: args.symbol,
    name: args.name,
    description: args.description,
    shortDescription: args.shortDescription,
    tags: args.tags,
    category: args.category,
    listingNetwork: args.listingNetwork,
    contractAddress: args.contractAddress,
    logoUrl: resolved.logoUrl,
    logoCid: resolved.logoCid,
    featuredImageUrl: resolved.featuredImageUrl,
    featuredImageCid: resolved.featuredImageCid,
    pageConfig,
    enabledModuleIds: args.enabledModuleIds,
    author: args.author,
    assetKind: args.assetKind,
    deployerAddress: args.deployerAddress,
    maxSupply: args.maxSupply,
    totalSupply: args.totalSupply,
    decimals: args.decimals,
    onChainSnapshot: args.onChainSnapshot,
    networks: args.networks,
    modulesConfig: args.modulesConfig,
  };
}

export function CreateTokenForm({ listing, media, onMediaChange, onSuccess, onCancelEdit }: CreateTokenFormProps) {
  const isEditMode = Boolean(listing);
  const { tier } = useKREXBalance();
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { publishNewListing, updateExistingListing, discountPercent } = useTokens();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const canPublish = kaspaState.isConnected && Boolean(kaspaState.address);

  const [symbol, setSymbol] = useState(listing?.symbol ?? '');
  const [name, setName] = useState(listing?.name ?? '');
  const [description, setDescription] = useState(() => contentForRichEditor(listing?.description ?? ''));
  const [shortDescription, setShortDescription] = useState(listing?.shortDescription ?? '');
  const [tags, setTags] = useState((listing?.tags ?? []).join(', '));
  const [category, setCategory] = useState(listing?.category ?? 'Other');
  const [listingNetwork, setListingNetwork] = useState<TokenListingNetwork>(
    listing?.listingNetwork ?? tokenNetworkToListingNetwork(listing?.network ?? 'L2', listing?.contractAddress),
  );
  const [contractAddress, setContractAddress] = useState(listing?.contractAddress ?? '');
  const [assetKind, setAssetKind] = useState<TokenAssetKind>(listing?.assetKind ?? 'fictional');
  const [onChainSnapshot, setOnChainSnapshot] = useState<TokenOnChainSnapshot | null>(listing?.onChainSnapshot ?? null);
  const [deployerAddress, setDeployerAddress] = useState(listing?.deployerAddress ?? '');
  const [tokenDecimals, setTokenDecimals] = useState<number | undefined>(listing?.decimals);
  const [maxSupply, setMaxSupply] = useState<number | undefined>(listing?.maxSupply);
  const [totalSupply, setTotalSupply] = useState<number | undefined>(listing?.totalSupply);
  const [krc20Selected, setKrc20Selected] = useState<Krc20TokenInfo | null>(
    listing?.onChainSnapshot?.source === 'krc20' ? (listing.onChainSnapshot as Krc20TokenInfo) : null,
  );
  const [l2LookupLoading, setL2LookupLoading] = useState(false);
  const [l2LookupError, setL2LookupError] = useState<string | null>(null);
  const [secondaryNetworks, setSecondaryNetworks] = useState<SecondaryNetworkRow[]>(() =>
    initSecondaryNetworks(listing),
  );

  const isRealToken = assetKind === 'real';
  const isKrc20Network = listingNetwork === 'krc20';
  const isL2Network = listingNetwork === 'l2_kasplex' || listingNetwork === 'l2_igra';
  const onChainLocked = isRealToken && Boolean(onChainSnapshot);

  const applyKrc20Selection = useCallback((info: Krc20TokenInfo | null) => {
    setKrc20Selected(info);
    if (!info) {
      setOnChainSnapshot(null);
      setDeployerAddress('');
      setTokenDecimals(undefined);
      setMaxSupply(undefined);
      setTotalSupply(undefined);
      return;
    }
    const dec = info.decimals ?? 8;
    setSymbol(info.ticker);
    setName(info.name ?? info.ticker);
    setOnChainSnapshot(info);
    setDeployerAddress(info.deployer ?? '');
    setTokenDecimals(dec);
    setMaxSupply(parseSupplyNumber(info.maxSupply, dec));
    setTotalSupply(parseSupplyNumber(info.minted, dec));
    if (info.contractAddress) setContractAddress(info.contractAddress);
    setSectionToggles((prev) => ({ ...prev, tokenomics: true, markets: true }));
  }, []);

  const lookupL2Contract = useCallback(async () => {
    if (!isL2Network) return;
    setL2LookupError(null);
    setL2LookupLoading(true);
    try {
      const info = await fetchL2TokenInfo(contractAddress, listingNetwork as 'l2_kasplex' | 'l2_igra');
      if (!info) {
        setL2LookupError('Could not read this contract. Check the address and network.');
        return;
      }
      const dec = info.decimals ?? 18;
      setSymbol(info.ticker);
      setName(info.name ?? info.ticker);
      setOnChainSnapshot(info);
      setDeployerAddress(info.owner ?? info.deployer ?? '');
      setTokenDecimals(dec);
      setMaxSupply(undefined);
      setTotalSupply(parseSupplyNumber(info.minted, dec));
    } catch {
      setL2LookupError('L2 lookup failed. Try again.');
    } finally {
      setL2LookupLoading(false);
    }
  }, [contractAddress, isL2Network, listingNetwork]);

  useEffect(() => {
    if (!isRealToken || !isL2Network) return;
    const addr = contractAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return;
    const timer = window.setTimeout(() => void lookupL2Contract(), 600);
    return () => window.clearTimeout(timer);
  }, [contractAddress, isRealToken, isL2Network, lookupL2Contract]);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(
    () => new Set(listing?.paidModuleIds ?? []),
  );
  const [modulesConfig, setModulesConfig] = useState<TokenModulesConfig>(listing?.modulesConfig ?? {});
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [sectionToggles, setSectionToggles] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const section of listing?.pageConfig?.sections ?? []) {
      map[section.type] = section.enabled;
    }
    return map;
  });
  const [sectionOrder, setSectionOrder] = useState<TokenPageSectionType[]>(() => {
    const saved = (listing?.pageConfig?.sections ?? []).map((s) => s.type);
    const merged = [...saved];
    for (const type of PAGE_SECTION_TYPES) {
      if (!merged.includes(type)) merged.push(type);
    }
    return merged.length ? merged : [...PAGE_SECTION_TYPES];
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierDiscount = krexTierDiscountPercent(tier);
  const moduleDiscountPercent = getTokenModuleDiscountPercent(tier);

  const tagsArray = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, TOKEN_CONTENT_LIMITS.tags.max),
    [tags],
  );

  const resolvedMedia = useMemo(() => resolveTokenListingMedia(media), [media]);

  const assembledNetworks = useMemo(
    () =>
      buildNetworkEntries({
        primaryNetwork: listingNetwork,
        primaryAddress: contractAddress,
        primaryVerified: listing?.ownership === 'deployer_verified',
        secondaryNetworks: secondaryNetworks.map((row) => ({
          network: row.network,
          contractAddress: row.contractAddress,
        })),
      }),
    [listingNetwork, contractAddress, secondaryNetworks, listing?.ownership],
  );

  const livePageConfig = useMemo(
    () =>
      applyPageSectionConfig(
        createDefaultPageConfig([...enabledModules] as TokenModuleId[]),
        sectionToggles,
        sectionOrder,
      ),
    [enabledModules, sectionToggles, sectionOrder],
  );

  const previewToken: Token = useMemo(
    () => ({
      id: listing?.id ?? 'preview',
      slug: listing?.slug ?? 'preview',
      symbol: symbol.trim() || 'TICK',
      name: name.trim() || 'Token name',
      description: description.trim() || 'Token description preview.',
      shortDescription: shortDescription.trim() || undefined,
      network: listingNetworkToTokenNetwork(listingNetwork),
      contractAddress: contractAddress.trim() || undefined,
      l1Address: assembledNetworks.find((n) => n.network === 'krc20' || n.network === 'kaspa_l1')?.contractAddress,
      l2Address: assembledNetworks.find((n) => n.network === 'l2_kasplex' || n.network === 'l2_igra')?.contractAddress,
      networks: assembledNetworks,
      logo: resolvedMedia.logoUrl,
      logoCid: resolvedMedia.logoCid,
      featuredImage: resolvedMedia.featuredImageUrl,
      featuredImageCid: resolvedMedia.featuredImageCid,
      type: 'collab',
      tags: tagsArray,
      category,
      assetKind,
      listing: {
        verified: listing?.ownership === 'deployer_verified',
        deployerVerified: listing?.ownership === 'deployer_verified',
        instantUtility:
          assetKind === 'real' &&
          listing?.ownership === 'deployer_verified' &&
          enabledModules.has('utility_integrations'),
        featured: enabledModules.has('featured_listing'),
      },
      paidModuleIds: filterModulesForAssetKind(
        Array.from(enabledModules) as TokenModuleId[],
        assetKind,
      ),
      modulesConfig,
    }),
    [
      symbol,
      name,
      description,
      shortDescription,
      tagsArray,
      category,
      enabledModules,
      modulesConfig,
      listingNetwork,
      contractAddress,
      listing,
      resolvedMedia,
      assembledNetworks,
    ],
  );

  const draftExtras = {
    category,
    assetKind,
    deployerAddress: deployerAddress || undefined,
    maxSupply,
    totalSupply,
    decimals: tokenDecimals,
    onChainSnapshot: onChainSnapshot ?? undefined,
    networks: assembledNetworks,
    modulesConfig,
  };

  const formQuote = useMemo(() => {
    if (!walletAddress) {
      return estimateTokenListingQuote({
        draft: buildFormDraft({
          symbol: symbol.trim() || 'TICK',
          name: name.trim() || 'Token',
          description: description || ' ',
          shortDescription,
          tags: tagsArray,
          listingNetwork,
          contractAddress,
          media,
          enabledModuleIds: Array.from(enabledModules) as TokenModuleId[],
          sectionToggles,
          sectionOrder,
          author: 'kaspa:preview',
          ...draftExtras,
        }),
        action: isEditMode ? 'edit' : 'create',
        discountPercent: tierDiscount,
        excludeModuleIds: isEditMode ? (listing?.paidModuleIds ?? []) : [],
        priorPricingSnapshot:
          isEditMode && listing?.pricingSnapshot?.payloadBytes != null
            ? {
                payloadBytes: listing.pricingSnapshot.payloadBytes!,
                chunkCount: listing.pricingSnapshot.chunkCount ?? 1,
              }
            : undefined,
      });
    }
    const draft = buildFormDraft({
      symbol,
      name,
      description,
      shortDescription,
      tags: tagsArray,
      listingNetwork,
      contractAddress,
      media,
      enabledModuleIds: Array.from(enabledModules) as TokenModuleId[],
      sectionToggles,
      sectionOrder,
      author: kaspaState.address ?? walletAddress,
      ...draftExtras,
    });
    const newModuleIds = Array.from(enabledModules).filter(
      (id) => !listing?.paidModuleIds?.includes(id as TokenModuleId),
    ) as TokenModuleId[];
    return estimateTokenListingQuote({
      draft,
      action: isEditMode ? 'edit' : 'create',
      discountPercent: tierDiscount,
      moduleIds: isEditMode ? newModuleIds : draft.enabledModuleIds,
      excludeModuleIds: isEditMode ? (listing?.paidModuleIds ?? []) : [],
      priorPricingSnapshot:
        isEditMode && listing?.pricingSnapshot?.payloadBytes != null
          ? {
              payloadBytes: listing.pricingSnapshot.payloadBytes!,
              chunkCount: listing.pricingSnapshot.chunkCount ?? 1,
            }
          : undefined,
    });
  }, [
    symbol,
    name,
    description,
    shortDescription,
    tagsArray,
    category,
    listingNetwork,
    contractAddress,
    media,
    enabledModules,
    sectionToggles,
    sectionOrder,
    tierDiscount,
    isEditMode,
    listing,
    walletAddress,
    assetKind,
    deployerAddress,
    maxSupply,
    totalSupply,
    tokenDecimals,
    onChainSnapshot,
  ]);

  const toggleModule = (id: string) => {
    if (!isRealToken && isIntegrationModule(id as TokenModuleId)) return;
    setEnabledModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (id === 'roadmap_editor') setSectionToggles((prev) => ({ ...prev, roadmap: true }));
    if (id === 'utility_integrations') setSectionToggles((prev) => ({ ...prev, utility: true }));
    if (id === 'on_chain_poll') setSectionToggles((prev) => ({ ...prev, utility: true }));
  };

  const toggleSection = (type: TokenPageSectionType) => {
    setSectionToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const addSection = (type: TokenPageSectionType) => {
    setSectionToggles((prev) => ({ ...prev, [type]: true }));
    if (OVERVIEW_CANVAS_BLOCKS.includes(type)) {
      setSectionOrder((prev) => (prev.includes(type) ? prev : [...prev, type]));
    }
  };

  const removeSection = (type: TokenPageSectionType) => {
    if (type === 'overview') return;
    setSectionToggles((prev) => ({ ...prev, [type]: false }));
  };

  const reorderSection = (from: TokenPageSectionType, to: TokenPageSectionType) => {
    if (from === to) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(from);
      const toIdx = next.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, from);
      return next;
    });
  };

  const secondaryNetworkOptions = useMemo(
    () => getSecondaryNetworkOptions(listingNetwork),
    [listingNetwork],
  );

  const addSecondaryNetwork = () => {
    const available = secondaryNetworkOptions.filter(
      (n) => !secondaryNetworks.some((row) => row.network === n),
    );
    if (available.length === 0) return;
    setSecondaryNetworks((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        network: available[0],
        contractAddress: '',
      },
    ]);
  };

  const updateSecondaryNetwork = (id: string, patch: Partial<SecondaryNetworkRow>) => {
    setSecondaryNetworks((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeSecondaryNetwork = (id: string) => {
    setSecondaryNetworks((prev) => prev.filter((row) => row.id !== id));
  };

  const handlePublish = async () => {
    setError(null);
    if (!symbol.trim() || !name.trim() || !shortDescription.trim()) {
      setError('Ticker, name, and short description are required.');
      return;
    }
    if (getTokenCharacterCount(description) < TOKEN_CONTENT_LIMITS.description.min) {
      setError(`Main content must be at least ${TOKEN_CONTENT_LIMITS.description.min} characters.`);
      return;
    }
    if (!walletAddress) {
      setError('Connect your wallet to continue.');
      return;
    }
    if (!canPublish) {
      setError('Publishing requires a connected Kaspa L1 wallet for the listing payment.');
      return;
    }

    if (isRealToken && isKrc20Network && !onChainSnapshot) {
      setError('Select a KRC-20 token from the lookup results before publishing.');
      return;
    }
    if (isRealToken && isL2Network && !onChainSnapshot) {
      setError('Load on-chain data for the L2 contract before publishing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input = {
        symbol: symbol.trim(),
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        tags: tagsArray,
        category,
        listingNetwork,
        contractAddress: contractAddress.trim() || undefined,
        logoUrl: resolvedMedia.logoUrl,
        logoCid: resolvedMedia.logoCid,
        featuredImageUrl: resolvedMedia.featuredImageUrl,
        featuredImageCid: resolvedMedia.featuredImageCid,
        enabledModuleIds: Array.from(enabledModules) as TokenModuleId[],
        sectionToggles,
        sectionOrder,
        assetKind,
        deployerAddress: deployerAddress || undefined,
        maxSupply,
        totalSupply,
        decimals: tokenDecimals,
        onChainSnapshot: onChainSnapshot ?? undefined,
        networks: assembledNetworks,
        modulesConfig,
        paymentCurrency,
      };
      const result = listing
        ? await updateExistingListing(listing.id, input, kaspaState.address!)
        : await publishNewListing(input, kaspaState.address!);
      if (!result) throw new Error('Failed to save listing');
      onSuccess?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = (text: string) => getTokenCharacterCount(text);

  return (
    <>
      {error ? (
        <Alert type="error" title="Could not publish" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {!canPublish && (walletAddress || isEvmConnected) ? (
        <Alert type="info" title="Kaspa wallet required" className="mb-4">
          Connect Kasware (or another Kaspa L1 wallet) to pay the listing fee and verify on-chain.
        </Alert>
      ) : null}

      <form
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start"
        onSubmit={(e) => {
          e.preventDefault();
          void handlePublish();
        }}
      >
        <div className="flex flex-col gap-6 min-w-0">
          <div className={`${FORM_PANEL_CLASS} space-y-6 scroll-mt-24`} id="tokens-dashboard-main">
            <div>
              <DAppSectionHeader title="Main content" className="mb-3" />
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                {isEditMode ? 'Edit Token Listing' : 'Create Token Listing'}
              </h3>
              <p className="kx-body">
                {isEditMode
                  ? `Update your landing page. Estimated cost: ${formQuote.totalKas} KAS (${formQuote.chunkCount} chunk${formQuote.chunkCount === 1 ? '' : 's'}).`
                  : `List your token, verify ownership, and build a modular landing page. Estimated cost: ${formQuote.totalKas} KAS.`}
                {discountPercent > 0 ? ` KREX tier discount: ${discountPercent}%.` : ''}
              </p>
              {isEditMode && onCancelEdit ? (
                <button type="button" onClick={onCancelEdit} className="mt-3 text-sm text-[#02abb8] hover:underline">
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div>
              <KxFormFieldLabel>Token type</KxFormFieldLabel>
              <p className="kx-body-sm mb-3">
                Choose whether you are listing a fictional/community token or an existing on-chain token.
              </p>
              <KxSegmentToggle
                value={assetKind}
                onChange={(v) => {
                  setAssetKind(v);
                  if (v === 'fictional') {
                    setOnChainSnapshot(null);
                    setKrc20Selected(null);
                    setDeployerAddress('');
                    setEnabledModules((prev) => {
                      const next = new Set(
                        filterModulesForAssetKind([...prev] as TokenModuleId[], 'fictional'),
                      );
                      return next;
                    });
                    setModulesConfig((prev) => ({
                      ...prev,
                      utilityProducts: [],
                      poll: undefined,
                    }));
                    setSectionToggles((prev) => ({ ...prev, utility: false }));
                  }
                }}
                options={[
                  { value: 'fictional', label: 'Fictional / community' },
                  { value: 'real', label: 'Real (on-chain)' },
                ]}
                ariaLabel="Token asset kind"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <KxFormFieldLabel>
                  Primary network <span className="text-red-500">*</span>
                </KxFormFieldLabel>
                <p className="kx-body-sm mb-2">The verified network for this token project.</p>
                <div className="mt-2">
                  <KxFormDropdown
                    ariaLabel="Primary listing network"
                    value={listingNetwork}
                    onChange={(value) => {
                      const next = value as TokenListingNetwork;
                      setListingNetwork(next);
                      setOnChainSnapshot(null);
                      setKrc20Selected(null);
                      setSecondaryNetworks((prev) => prev.filter((row) => row.network !== next));
                    }}
                    options={TOKEN_LISTING_NETWORK_OPTIONS.map((opt) => ({
                      value: opt.id,
                      label: opt.label,
                      disabled: opt.disabled,
                    }))}
                    disabled={isSubmitting || onChainLocked}
                  />
                </div>
              </div>
              {!isRealToken || !isKrc20Network ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <KxFormFieldLabel>
                      {isRealToken && isL2Network ? 'Contract address' : 'Contract / ticker address'}
                    </KxFormFieldLabel>
                    <span className="text-xs text-zinc-500">{contractAddress.length} / {TOKEN_CONTENT_LIMITS.contractAddress.max}</span>
                  </div>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value.slice(0, TOKEN_CONTENT_LIMITS.contractAddress.max))}
                    placeholder={isL2Network ? '0x…' : 'kaspa:…'}
                    className="k-input text-base w-full"
                    disabled={isSubmitting || (onChainLocked && !isL2Network)}
                  />
                  {isRealToken && isL2Network && l2LookupLoading ? (
                    <p className="mt-1 text-xs text-zinc-500">Reading contract on-chain…</p>
                  ) : null}
                  {l2LookupError ? <p className="mt-1 text-xs text-red-500">{l2LookupError}</p> : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <KxFormFieldLabel>Additional networks</KxFormFieldLabel>
                  <p className="kx-body-sm">
                    Add wrapped or bridged deployments (e.g. Kasplex L2, Igra L2). These appear as linked /
                    unverified until you verify them later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSecondaryNetwork}
                  disabled={isSubmitting || secondaryNetworkOptions.length <= secondaryNetworks.length}
                  className="k-control-btn text-sm shrink-0 disabled:opacity-50"
                >
                  Add network
                </button>
              </div>
              {secondaryNetworks.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No additional networks yet. Use this for tokens that exist on multiple chains.
                </p>
              ) : (
                <div className="space-y-3">
                  {secondaryNetworks.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-3 items-end"
                    >
                      <div>
                        <KxFormFieldLabel>Network</KxFormFieldLabel>
                        <div className="mt-2">
                          <KxFormDropdown
                            ariaLabel="Secondary network"
                            value={row.network}
                            onChange={(value) =>
                              updateSecondaryNetwork(row.id, { network: value as TokenListingNetwork })
                            }
                            options={secondaryNetworkOptions
                              .filter(
                                (n) =>
                                  n === row.network ||
                                  !secondaryNetworks.some((other) => other.id !== row.id && other.network === n),
                              )
                              .map((n) => ({
                                value: n,
                                label:
                                  TOKEN_LISTING_NETWORK_OPTIONS.find((opt) => opt.id === n)?.label ??
                                  n,
                              }))}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div>
                        <KxFormFieldLabel>Contract address</KxFormFieldLabel>
                        <input
                          type="text"
                          value={row.contractAddress}
                          onChange={(e) =>
                            updateSecondaryNetwork(row.id, {
                              contractAddress: e.target.value.slice(0, TOKEN_CONTENT_LIMITS.contractAddress.max),
                            })
                          }
                          placeholder={getNetworkAddressPlaceholder(row.network)}
                          className="k-input text-base mt-2 w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSecondaryNetwork(row.id)}
                        className="k-control-btn text-sm text-red-600 dark:text-red-400 mb-0.5"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isRealToken && isKrc20Network ? (
              <Krc20TickerSearchField
                value={symbol}
                onChange={setSymbol}
                onSelect={applyKrc20Selection}
                disabled={isSubmitting}
                selected={krc20Selected}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <KxFormFieldLabel>
                    Ticker symbol <span className="text-red-500">*</span>
                  </KxFormFieldLabel>
                  <span className="text-xs text-zinc-500">{symbol.length} / {TOKEN_CONTENT_LIMITS.symbol.max}</span>
                </div>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, TOKEN_CONTENT_LIMITS.symbol.max))}
                  placeholder="e.g. KREX"
                  className="k-input text-base w-full"
                  required
                  disabled={isSubmitting || isEditMode || onChainLocked}
                />
              </div>
            )}

            {onChainSnapshot ? (
              <div className="rounded-xl border border-[#02abb8]/30 bg-[#02abb8]/5 p-4 text-sm">
                <p className="font-semibold text-[#02abb8] mb-2">On-chain tokenomics loaded</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {onChainSnapshot.maxSupply ? (
                    <span>Max supply: {formatKrc20Supply(onChainSnapshot.maxSupply, onChainSnapshot.decimals ?? 8)}</span>
                  ) : null}
                  {onChainSnapshot.minted ? (
                    <span>
                      {onChainSnapshot.source === 'l2' ? 'Total supply' : 'Minted'}:{' '}
                      {onChainSnapshot.source === 'l2'
                        ? formatL2Supply(onChainSnapshot.minted, onChainSnapshot.decimals ?? 18)
                        : formatKrc20Supply(onChainSnapshot.minted, onChainSnapshot.decimals ?? 8)}
                    </span>
                  ) : null}
                  {deployerAddress ? (
                    <span className="col-span-2 truncate font-mono text-[10px]" title={deployerAddress}>
                      {onChainSnapshot.source === 'l2' ? 'Owner' : 'Deployer'}: {deployerAddress}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between mb-2">
                <KxFormFieldLabel>
                  Token name <span className="text-red-500">*</span>
                </KxFormFieldLabel>
                <span className="text-xs text-zinc-500">{name.length} / {TOKEN_CONTENT_LIMITS.name.max}</span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, TOKEN_CONTENT_LIMITS.name.max))}
                placeholder="Full token name"
                className="k-input text-base w-full"
                required
                disabled={isSubmitting || (onChainLocked && isRealToken)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <KxFormFieldLabel>
                  Short description <span className="text-red-500">*</span>
                </KxFormFieldLabel>
                <span
                  className={`text-xs ${
                    charCount(shortDescription) > TOKEN_CONTENT_LIMITS.shortDescription.max
                      ? 'text-red-500'
                      : 'text-zinc-500'
                  }`}
                >
                  {charCount(shortDescription)} / {TOKEN_CONTENT_LIMITS.shortDescription.max}
                </span>
              </div>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value.slice(0, TOKEN_CONTENT_LIMITS.shortDescription.max))}
                placeholder="One-line summary for cards and search"
                rows={2}
                className="k-input text-base w-full resize-y min-h-[3rem]"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <KxFormFieldLabel>
                  Main content <span className="text-red-500">*</span>
                </KxFormFieldLabel>
                <span
                  className={`text-xs ${
                    charCount(description) > TOKEN_CONTENT_LIMITS.description.max
                      ? 'text-red-500'
                      : 'text-zinc-500'
                  }`}
                >
                  {charCount(description)} / {TOKEN_CONTENT_LIMITS.description.max}
                </span>
              </div>
              <KxRichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Full description for your landing page"
                minRows={10}
                maxLength={TOKEN_CONTENT_LIMITS.description.max}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <KxFormFieldLabel>Category</KxFormFieldLabel>
              <div className="mt-2">
                <TokenCategoryField
                  authorAddress={walletAddress}
                  value={category}
                  onChange={setCategory}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <KxFormFieldLabel>Tags (comma-separated)</KxFormFieldLabel>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="defi, governance, utility"
                className="k-input mt-2 w-full"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={`${FORM_PANEL_CLASS} space-y-6 scroll-mt-24`} id="tokens-dashboard-media">
            <DAppSectionHeader title="Listing media" className="mb-1" />
            <p className="kx-body-sm">
              Upload your token logo and featured banner via direct URL or IPFS, same as vBlog article media.
            </p>
            <TokenListingMediaPanel media={media} onChange={onMediaChange} disabled={isSubmitting} embedded />
          </div>

          <div className={`${FORM_PANEL_CLASS} scroll-mt-24`} id="tokens-dashboard-sections">
            <TokenPageBuilder
              pageConfig={livePageConfig}
              sectionToggles={sectionToggles}
              sectionOrder={sectionOrder}
              disabled={isSubmitting}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onReorderSections={reorderSection}
            />
          </div>

          <div className="space-y-4 scroll-mt-24" id="tokens-dashboard-modules">
            <div className={FORM_PANEL_CLASS}>
              <DAppSectionHeader title="Premium modules" className="mb-1" />
              <p className="kx-body-sm mb-4">
                Unlock roadmap editors, Hub integrations, analytics, and featured placement.
                {!isRealToken
                  ? ' Fictional tokens can use presentation modules only. Real on-chain tokens unlock integrations after deployer verification.'
                  : ''}
                {moduleDiscountPercent > 0 ? ` KREX tier discount: ${moduleDiscountPercent}% off modules.` : ''}
              </p>
            </div>
            {TOKEN_MODULE_OFFERS.filter((offer) => isRealToken || !isIntegrationModule(offer.id)).map((offer) => (
              <div key={offer.id} className={PREMIUM_MODULE_CARD_CLASS}>
                <KxInFormPremiumRow
                  flat
                  title={offer.title}
                  description={offer.description}
                  priceLabel={
                    listing?.paidModuleIds?.includes(offer.id) ? 'Paid' : `+${offer.unlockPriceKas} KAS`
                  }
                  checked={enabledModules.has(offer.id)}
                  onToggle={() => toggleModule(offer.id)}
                  disabled={listing?.paidModuleIds?.includes(offer.id) || isSubmitting}
                />
              </div>
            ))}
            <TokenModuleConfigFields
              config={modulesConfig}
              onChange={setModulesConfig}
              enabledModuleIds={enabledModules}
              isRealToken={isRealToken}
              marketsSectionEnabled={sectionToggles.markets ?? false}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-6">
          <TokensBenefitsPanel variant="panel" />
          <aside className="flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(2,171,184,0.4)]">
            <DAppSectionHeader title="Calculation breakdown" className="mb-1" />
            <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Base fee</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.baseFeeKas} KAS</span>
              </div>
              <div className="flex justify-between">
                <span>Size fee</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.sizeFeeKas} KAS</span>
              </div>
              {formQuote.moduleLines.map((line) => (
                <div key={line.id} className="flex justify-between gap-2">
                  <span className="truncate">{line.title}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">+{line.kas} KAS</span>
                </div>
              ))}
              {formQuote.modulesFeeKas > 0 ? (
                <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
                  <span>Modules subtotal</span>
                  <span className="font-semibold text-[#02abb8]">{formQuote.modulesFeeKas} KAS</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Network buffer</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.networkFeeBufferKas} KAS</span>
              </div>
              {formQuote.discountKas > 0 ? (
                <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
                  <span>KREX discount</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">-{formQuote.discountKas} KAS</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
                <span>Payload bytes</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.payloadBytes}</span>
              </div>
              <div className="flex justify-between">
                <span>Chunk estimate</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.chunkCount}</span>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Pay with</p>
              <KxSegmentToggle
                value={paymentCurrency}
                onChange={setPaymentCurrency}
                options={STORE_PAYMENT_CURRENCIES.map((c) => ({ value: c, label: c }))}
                ariaLabel="Payment currency"
              />
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {formatTokenModulePaymentLabel(paymentCurrency, formQuote.totalKas)}
              </p>
            </div>
            <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
              One Kaspa L1 payment commits your listing payload on-chain. Chunk count and size fees follow the same model
              as vBlog.
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !canPublish}
              className="w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Publishing…'
                : isEditMode
                  ? `Update listing (${formQuote.totalKas} KAS)`
                  : `Publish listing (${formQuote.totalKas} KAS)`}
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="w-full k-control-btn"
              disabled={isSubmitting}
            >
              Preview Token Page
            </button>
          </aside>
        </div>
      </form>
      <TokenPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        token={previewToken}
        pageConfig={livePageConfig}
      />
    </>
  );
}
