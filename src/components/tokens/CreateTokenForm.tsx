'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxTagsField } from '@/components/ui/KxTagsField';
import { normalizeHubTags } from '@/lib/hub/suggestedTags';
import { Krc20TickerSearchField } from '@/components/tokens/Krc20TickerSearchField';
import { Kcc20ConnectField } from '@/components/tokens/Kcc20ConnectField';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { TokenPreviewModal } from '@/components/tokens/TokenPreviewModal';
import { TokenPageBuilder } from '@/components/tokens/TokenPageBuilder';
import { TokenCategoryField } from '@/components/tokens/TokenCategoryField';
import {
  resolveTokenListingMedia,
  TokenListingMediaPanel,
  type TokenListingMediaState,
} from '@/components/tokens/TokenListingMediaPanel';
import { TOKEN_MODULE_OFFERS, type TokenModuleId, getTokenModuleDiscountPercent, getTokenModuleEffectivePriceKas, type TokenModulesConfig, DEFAULT_HIGHLIGHT_HALO_COLOR } from '@/lib/tokens/modules';
import { validateTokenModulesForPublish } from '@/lib/tokens/formValidation';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { buildKasKrexCurrencyOptions, formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';
import { buildPublicHubCurrencyCatalog } from '@/lib/payments/publicPaymentTokens';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';
import { filterModulesForAssetKind, filterModuleOffersForListing, isIntegrationModule } from '@/lib/tokens/utilityEligibility';
import { estimateTokenListingQuote } from '@/lib/tokens/pricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { listPublicVerifiedPaymentTokens } from '@/lib/payments/publicPaymentTokens';
import { mergePricingTickers } from '@/lib/pricing';
import { TokenModuleConfigFields, tokenModuleHasConfigFields } from '@/components/tokens/TokenModuleConfigFields';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { Token } from '@/lib/tokens/types';
import type { PublishedTokenListing, TokenAssetKind, TokenOnChainSnapshot, TokenNetworkEntry, TokenPageSectionType } from '@/lib/tokens/listingRecord';
import { createDefaultPageConfig, applyPageSectionConfig, OVERVIEW_CANVAS_BLOCKS } from '@/lib/tokens/pageConfig';
import {
  TOKEN_LISTING_NETWORK_OPTIONS,
  getListingNetworkShortTitle,
  listingNetworkToTokenNetwork,
  tokenNetworkToListingNetwork,
} from '@/lib/tokens/listingNetwork';
import type { TokenListingNetwork } from '@/lib/tokens/listingNetwork';
import { TOKEN_CONTENT_LIMITS, getTokenCharacterCount } from '@/lib/tokens/limits';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import type { TokenListingDraft } from '@/lib/tokens/publish';
import { contentForRichEditor } from '@/lib/richText/html';
import { useTokens } from '@/hooks/useTokens';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { Alert } from '@/components/Alert';
import type { Krc20TokenInfo } from '@/lib/tokens/krc20Lookup';
import type { Kcc20TokenInfo } from '@/lib/tokens/kcc20Lookup';
import { formatKrc20Supply } from '@/lib/tokens/krc20Lookup';
import { formatKcc20Sompi } from '@/lib/tokens/kcc20Lookup';
import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import { kronMarketEntry, normalizeKcc20ConnectPaste } from '@/lib/programmable/kron';
import { fetchL2TokenInfo, formatL2Supply } from '@/lib/tokens/l2TokenLookup';
import {
  buildNetworkEntries,
  getNetworkAddressPlaceholder,
} from '@/lib/tokens/networks';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import { KX_PREMIUM_MODULE_CARD } from '@/lib/hub/shellTokens';

const FORM_PANEL_CLASS =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm';

const PREMIUM_MODULE_CARD_CLASS = KX_PREMIUM_MODULE_CARD;

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

function initNetworkOrder(
  listing: PublishedTokenListing | null | undefined,
  primary: TokenListingNetwork,
  secondary: SecondaryNetworkRow[],
): TokenListingNetwork[] {
  if (listing?.networks?.length) {
    return Array.from(new Set(listing.networks.map((n) => n.network)));
  }
  return Array.from(new Set([primary, ...secondary.map((row) => row.network)]));
}

interface CreateTokenFormProps {
  listing?: PublishedTokenListing | null;
  media: TokenListingMediaState;
  onMediaChange: (next: TokenListingMediaState) => void;
  onSuccess?: (listing: PublishedTokenListing) => void;
  onCancelEdit?: () => void;
  /** Prefill from dashboard deep-link (e.g. return from KRON with covenant id). */
  connectPrefill?: {
    covenantId: string;
    network?: ProgrammableNetworkId;
    fromKron?: boolean;
  } | null;
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

export function CreateTokenForm({
  listing,
  media,
  onMediaChange,
  onSuccess,
  onCancelEdit,
  connectPrefill = null,
}: CreateTokenFormProps) {
  const isEditMode = Boolean(listing);
  const { tier, balance: krexBalance } = useKREXBalance();
  const publicPayTicks = useMemo(
    () =>
      listPublicVerifiedPaymentTokens()
        .filter((t) => t.kind === 'krc20' && t.tick)
        .map((t) => t.tick!),
    [],
  );
  const { snapshot: pricingSnapshot } = usePricingSnapshot(mergePricingTickers(['KREX'], publicPayTicks));
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { publishNewListing, updateExistingListing, discountPercent } = useTokens();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const canPublish = kaspaState.isConnected && Boolean(kaspaState.address);

  const [symbol, setSymbol] = useState(listing?.symbol ?? '');
  const [name, setName] = useState(listing?.name ?? '');
  const [description, setDescription] = useState(() => contentForRichEditor(listing?.description ?? ''));
  const [shortDescription, setShortDescription] = useState(listing?.shortDescription ?? '');
  const [tags, setTags] = useState<string[]>(() => normalizeHubTags(listing?.tags ?? []));
  const [category, setCategory] = useState(listing?.category ?? 'Other');
  const [assetKind] = useState<TokenAssetKind>('real');
  const [listingNetwork, setListingNetwork] = useState<TokenListingNetwork>(() => {
    if (listing?.listingNetwork) return listing.listingNetwork;
    if (connectPrefill?.covenantId) return 'kcc20';
    return 'kcc20';
  });
  const [contractAddress, setContractAddress] = useState(listing?.contractAddress ?? '');
  const [onChainSnapshot, setOnChainSnapshot] = useState<TokenOnChainSnapshot | null>(listing?.onChainSnapshot ?? null);
  const [deployerAddress, setDeployerAddress] = useState(listing?.deployerAddress ?? '');
  const [tokenDecimals, setTokenDecimals] = useState<number | undefined>(listing?.decimals);
  const [maxSupply, setMaxSupply] = useState<number | undefined>(listing?.maxSupply);
  const [totalSupply, setTotalSupply] = useState<number | undefined>(listing?.totalSupply);
  const [krc20Selected, setKrc20Selected] = useState<Krc20TokenInfo | null>(
    listing?.onChainSnapshot?.source === 'krc20' ? (listing.onChainSnapshot as Krc20TokenInfo) : null,
  );
  const [kcc20Selected, setKcc20Selected] = useState<Kcc20TokenInfo | null>(
    listing?.onChainSnapshot?.source === 'kcc20' ? (listing.onChainSnapshot as Kcc20TokenInfo) : null,
  );
  const [kcc20ConnectInput, setKcc20ConnectInput] = useState(() => {
    if (listing?.onChainSnapshot?.source === 'kcc20') {
      return listing.onChainSnapshot.covenantId ?? listing.contractAddress ?? '';
    }
    if (connectPrefill?.covenantId) {
      return normalizeKcc20ConnectPaste(connectPrefill.covenantId);
    }
    return '';
  });
  const [kcc20AutoLookup] = useState(() => Boolean(connectPrefill?.covenantId && !listing));
  const [l2LookupLoading, setL2LookupLoading] = useState(false);
  const [l2LookupError, setL2LookupError] = useState<string | null>(null);
  const [secondaryNetworks, setSecondaryNetworks] = useState<SecondaryNetworkRow[]>(() =>
    initSecondaryNetworks(listing),
  );
  const [networkOrder, setNetworkOrder] = useState<TokenListingNetwork[]>(() => {
    const secondary = initSecondaryNetworks(listing);
    const primary = listing?.listingNetwork ?? (connectPrefill?.covenantId ? 'kcc20' : 'kcc20');
    return initNetworkOrder(listing, primary, secondary);
  });

  const isRealToken = assetKind === 'real';
  const isKrc20Network = listingNetwork === 'krc20';
  const isKcc20Network = listingNetwork === 'kcc20';
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

  const applyKcc20Selection = useCallback(
    (info: Kcc20TokenInfo | null) => {
      setKcc20Selected(info);
      if (!info) {
        setOnChainSnapshot(null);
        setDeployerAddress('');
        setTokenDecimals(undefined);
        setMaxSupply(undefined);
        setTotalSupply(undefined);
        setContractAddress('');
        return;
      }
      const dec = info.decimals ?? 8;
      setSymbol(info.ticker);
      setName(info.name ?? info.ticker);
      setOnChainSnapshot(info);
      setContractAddress(info.covenantId);
      setKcc20ConnectInput(info.covenantId);
      setTokenDecimals(dec);
      setMaxSupply(parseSupplyNumber(info.maxSupply, dec));
      setTotalSupply(parseSupplyNumber(info.minted, dec));
      if (info.imageUrl) {
        onMediaChange({
          ...media,
          logoSource: 'url',
          logoUrl: info.imageUrl,
          logoCid: null,
          logoName: null,
        });
      }
      if (!shortDescription.trim() && info.name) {
        setShortDescription(`${info.name} (${info.ticker}) on Kaspa L1.`);
      }
      setSectionToggles((prev) => ({ ...prev, tokenomics: true, utility: true, markets: true }));
      setModulesConfig((prev) => {
        const existing = (prev.markets ?? []).filter((m) => m.name.trim() || m.url.trim());
        const kron = kronMarketEntry(info.covenantId);
        const hasKron = existing.some(
          (m) =>
            m.url.toLowerCase().includes('kron.technology/token/') ||
            m.name.trim().toLowerCase() === 'kron',
        );
        return {
          ...prev,
          markets: hasKron ? existing : [...existing, kron],
        };
      });
    },
    [media, onMediaChange, shortDescription],
  );

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
  const [paymentCurrency, setPaymentCurrency] = useState<string>('KAS');
  const [paymentOption, setPaymentOption] = useState<HubPaymentCurrencyOption>(
    () => buildKasKrexCurrencyOptions()[0],
  );
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

  const tagsArray = tags;

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
      listingNetwork,
      contractAddress: contractAddress.trim() || undefined,
      onChainSnapshot: onChainSnapshot ?? undefined,
      l1Address: assembledNetworks.find(
        (n) => n.network === 'krc20' || n.network === 'kaspa_l1' || n.network === 'kcc20',
      )?.contractAddress,
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
        listingNetwork,
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
      onChainSnapshot,
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
    if (id === 'highlighted_profile') {
      setModulesConfig((prev) => ({
        ...prev,
        highlightedProfile: {
          haloColor: prev.highlightedProfile?.haloColor ?? DEFAULT_HIGHLIGHT_HALO_COLOR,
          badgePlacement: prev.highlightedProfile?.badgePlacement ?? 'below-title',
        },
      }));
    }
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

  const selectedNetworkIds = useMemo(() => {
    const selected = new Set<TokenListingNetwork>([
      listingNetwork,
      ...secondaryNetworks.map((row) => row.network),
    ]);
    const ordered = networkOrder.filter((id) => selected.has(id));
    const missing = Array.from(selected).filter((id) => !networkOrder.includes(id));
    return [...ordered, ...missing];
  }, [listingNetwork, secondaryNetworks, networkOrder]);

  const addressByNetwork = useMemo(() => {
    const map = new Map<TokenListingNetwork, string>();
    map.set(listingNetwork, contractAddress);
    for (const row of secondaryNetworks) {
      map.set(row.network, row.contractAddress);
    }
    return map;
  }, [listingNetwork, contractAddress, secondaryNetworks]);

  const handleSelectedNetworksChange = (nextValues: string[]) => {
    const next = nextValues as TokenListingNetwork[];
    if (next.length === 0) return;

    const prevPrimary = listingNetwork;
    const prevPrimaryAddr = contractAddress;
    const prevSecondary = secondaryNetworks;

    let nextPrimary = prevPrimary;
    if (!next.includes(nextPrimary)) {
      nextPrimary = next[0];
    }

    const nextPrimaryAddr =
      nextPrimary === prevPrimary
        ? prevPrimaryAddr
        : prevSecondary.find((row) => row.network === nextPrimary)?.contractAddress ?? '';

    setNetworkOrder(next);
    setListingNetwork(nextPrimary);
    setContractAddress(nextPrimaryAddr);
    if (nextPrimary !== prevPrimary) {
      setOnChainSnapshot(null);
      setKrc20Selected(null);
      setKcc20Selected(null);
    }

    setSecondaryNetworks(
      next
        .filter((network) => network !== nextPrimary)
        .map((network, index) => {
          const existing = prevSecondary.find((row) => row.network === network);
          const fromPrimary = network === prevPrimary ? prevPrimaryAddr : '';
          return {
            id: existing?.id ?? `sec-${network}-${index}`,
            network,
            contractAddress: existing?.contractAddress ?? fromPrimary,
          };
        }),
    );
  };

  const setPrimaryNetwork = (network: TokenListingNetwork) => {
    if (network === listingNetwork) return;
    const nextPrimaryAddr = addressByNetwork.get(network) ?? '';
    const demoted: SecondaryNetworkRow = {
      id: `sec-${listingNetwork}-${Date.now()}`,
      network: listingNetwork,
      contractAddress,
    };
    // Keep display order stable; only swap primary ownership.
    setSecondaryNetworks((prev) => [...prev.filter((row) => row.network !== network), demoted]);
    setListingNetwork(network);
    setContractAddress(nextPrimaryAddr);
    setOnChainSnapshot(null);
    setKrc20Selected(null);
    setKcc20Selected(null);
  };

  const updateNetworkAddress = (network: TokenListingNetwork, value: string) => {
    const clipped = value.slice(0, TOKEN_CONTENT_LIMITS.contractAddress.max);
    if (network === listingNetwork) {
      setContractAddress(clipped);
      return;
    }
    setSecondaryNetworks((prev) =>
      prev.map((row) => (row.network === network ? { ...row, contractAddress: clipped } : row)),
    );
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

    const modulesErr = validateTokenModulesForPublish({
      enabledModuleIds: enabledModules,
      modulesConfig,
      marketsSectionEnabled: Boolean(sectionToggles.markets),
    });
    if (modulesErr) {
      setError(modulesErr);
      return;
    }

    if (isRealToken && isKrc20Network && !onChainSnapshot) {
      setError('Select a KRC-20 token from the lookup results before publishing.');
      return;
    }
    if (isRealToken && isKcc20Network && !onChainSnapshot) {
      setError('Connect a KCC-20 covenant before publishing.');
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
        paymentCurrency: paymentOption.id,
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
      <form
        className="grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,1fr)_340px] gap-6"
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
                {isEditMode ? 'Edit Token Listing' : 'List a Token'}
              </h3>
              <p className="kx-body">
                {isEditMode
                  ? 'Update your landing page content, modules, and on-chain listing metadata.'
                  : 'List a real on-chain token (KRC-20, KCC-20, or L2), verify deployer ownership after publish, and build a modular landing page. Verified tokens can appear in Hub Pay with catalogs.'}
              </p>
              {isEditMode && onCancelEdit ? (
                <button type="button" onClick={onCancelEdit} className="mt-3 text-sm text-[#02abb8] hover:underline">
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              <div>
                <KxFormFieldLabel>
                  Networks <span className="text-red-500">*</span>
                </KxFormFieldLabel>
                <div className={isSubmitting || onChainLocked ? 'pointer-events-none opacity-60' : undefined}>
                  <KxMultiSelectDropdown
                    ariaLabel="Token networks"
                    values={selectedNetworkIds}
                    onChange={handleSelectedNetworksChange}
                    options={TOKEN_LISTING_NETWORK_OPTIONS.filter((opt) => !opt.disabled).map((opt) => ({
                      value: opt.id,
                      label: opt.label,
                    }))}
                    placeholder="Select networks…"
                    triggerClassName="k-field-trigger min-w-[140px] h-10 w-full"
                    menuClassName="w-full min-w-[280px]"
                  />
                </div>
              </div>

              {selectedNetworkIds.length > 0 ? (
                <div className="space-y-3">
                  {selectedNetworkIds.map((network) => {
                    const isPrimary = network === listingNetwork;
                    const address = addressByNetwork.get(network) ?? '';
                    const title = getListingNetworkShortTitle(network);
                    const hideAddressForPrimaryLookup =
                      isPrimary && isRealToken && (isKrc20Network || isKcc20Network);
                    const addressLabel =
                      network === 'krc20'
                        ? 'Deployer address'
                        : network === 'l2_kasplex' || network === 'l2_igra'
                          ? 'Contract address'
                          : 'Contract / ticker address';

                    return (
                      <div
                        key={network}
                        className={`space-y-3 rounded-xl border border-dashed p-4 transition-colors ${
                          isPrimary
                            ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted)]'
                            : 'border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)]/40'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
                          <div
                            className={`flex items-center gap-2 ${
                              !isPrimary ? 'opacity-55' : ''
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Primary
                            </span>
                            <ToggleSwitch
                              checked={isPrimary}
                              disabled={isSubmitting || onChainLocked || isPrimary}
                              label={isPrimary ? 'On' : 'Off'}
                              onChange={(on) => {
                                if (on) setPrimaryNetwork(network);
                              }}
                            />
                          </div>
                        </div>
                        {!hideAddressForPrimaryLookup ? (
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <KxFormFieldLabel>{addressLabel}</KxFormFieldLabel>
                              <span className="text-xs text-zinc-500">
                                {address.length} / {TOKEN_CONTENT_LIMITS.contractAddress.max}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={address}
                              onChange={(e) => updateNetworkAddress(network, e.target.value)}
                              placeholder={getNetworkAddressPlaceholder(network)}
                              className="k-input w-full text-base"
                              disabled={
                                isSubmitting ||
                                (onChainLocked &&
                                  isPrimary &&
                                  network !== 'l2_kasplex' &&
                                  network !== 'l2_igra')
                              }
                            />
                            {isPrimary && isRealToken && isL2Network && l2LookupLoading ? (
                              <p className="mt-1 text-xs text-zinc-500">Reading contract on-chain…</p>
                            ) : null}
                            {isPrimary && l2LookupError ? (
                              <p className="mt-1 text-xs text-red-500">{l2LookupError}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {isRealToken && isKrc20Network ? (
              <Krc20TickerSearchField
                value={symbol}
                onChange={setSymbol}
                onSelect={applyKrc20Selection}
                disabled={isSubmitting}
                selected={krc20Selected}
              />
            ) : isRealToken && isKcc20Network ? (
              <Kcc20ConnectField
                value={kcc20ConnectInput}
                onChange={setKcc20ConnectInput}
                onSelect={applyKcc20Selection}
                disabled={isSubmitting}
                selected={kcc20Selected}
                autoLookup={kcc20AutoLookup}
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
                      {onChainSnapshot.source === 'l2'
                        ? 'Total supply'
                        : onChainSnapshot.source === 'kcc20'
                          ? 'Live value'
                          : 'Minted'}
                      :{' '}
                      {onChainSnapshot.source === 'l2'
                        ? formatL2Supply(onChainSnapshot.minted, onChainSnapshot.decimals ?? 18)
                        : onChainSnapshot.source === 'kcc20'
                          ? `${formatKcc20Sompi(onChainSnapshot.minted, onChainSnapshot.decimals ?? 8)} KAS`
                          : formatKrc20Supply(onChainSnapshot.minted, onChainSnapshot.decimals ?? 8)}
                    </span>
                  ) : null}
                  {onChainSnapshot.source === 'kcc20' && onChainSnapshot.covenantId ? (
                    <span className="col-span-2 truncate text-xs" title={onChainSnapshot.covenantId}>
                      Covenant: {onChainSnapshot.covenantId}
                    </span>
                  ) : null}
                  {deployerAddress ? (
                    <span className="col-span-2 truncate text-xs" title={deployerAddress}>
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
              <KxTagsField
                value={tags}
                onChange={setTags}
                disabled={isSubmitting}
                hint="Select up to 3 tags. Search suggestions or add your own."
              />
            </div>
          </div>

          <div className={`${FORM_PANEL_CLASS} space-y-6 scroll-mt-24`} id="tokens-dashboard-media">
            <DAppSectionHeader title="Listing media" className="mb-1" />
            <p className="kx-body-sm">
              Logo and basic tokenomics are filled from the connected on-chain token when available. Add a
              featured banner separately (URL or IPFS).
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
                  ? ' Real on-chain tokens unlock Hub utility integrations after deployer verification.'
                  : ''}
                {moduleDiscountPercent > 0 ? ` KREX tier discount: ${moduleDiscountPercent}% off modules.` : ''}
              </p>
            </div>
            {TOKEN_MODULE_OFFERS.filter((offer) =>
              filterModuleOffersForListing([offer], { assetKind, listingNetwork }).length > 0,
            ).map((offer) => {
              const paid = listing?.paidModuleIds?.includes(offer.id);
              const effectiveKas = getTokenModuleEffectivePriceKas(offer.unlockPriceKas, tier);
              const enabled = enabledModules.has(offer.id);
              const nestConfig =
                enabled &&
                tokenModuleHasConfigFields(offer.id) &&
                !(offer.id === 'timeline_builder' && enabledModules.has('roadmap_editor'));
              return (
                <div key={offer.id} className={`${PREMIUM_MODULE_CARD_CLASS} space-y-4`}>
                  <KxInFormPremiumRow
                    flat
                    title={offer.title}
                    description={
                      offer.id === 'native_subscriptions'
                        ? `${offer.description} (Preview: billing not live yet.)`
                        : isIntegrationModule(offer.id) && isRealToken
                          ? `${offer.description} Activates after deployer verify.`
                          : offer.description
                    }
                    priceLabel={paid ? 'Paid' : `+${effectiveKas} KAS`}
                    checked={enabled}
                    onToggle={() => toggleModule(offer.id)}
                    disabled={paid || isSubmitting}
                  />
                  {nestConfig ? (
                    <TokenModuleConfigFields
                      moduleId={offer.id}
                      bare
                      config={modulesConfig}
                      onChange={setModulesConfig}
                      enabledModuleIds={enabledModules}
                      isRealToken={isRealToken}
                      listingNetwork={listingNetwork}
                      disabled={isSubmitting}
                    />
                  ) : null}
                </div>
              );
            })}
            {sectionToggles.markets ? (
              <TokenModuleConfigFields
                moduleId="markets"
                config={modulesConfig}
                onChange={setModulesConfig}
                enabledModuleIds={enabledModules}
                isRealToken={isRealToken}
                listingNetwork={listingNetwork}
                marketsSectionEnabled
                covenantId={
                  onChainSnapshot?.source === 'kcc20'
                    ? onChainSnapshot.covenantId ?? contractAddress
                    : null
                }
                disabled={isSubmitting}
              />
            ) : null}
          </div>
        </div>

        <HubAsideRail adSlotId="HALO_TOKENS_RIGHT" adId="ad-slot-tokens-listing-form-rail">
          <TokensBenefitsPanel variant="panel" />
          <HubPaymentPanel
            lines={[
              {
                label: 'Base fee',
                value: formatHubPaymentAmount(paymentOption, formQuote.baseFeeKas, {
                  snapshot: pricingSnapshot,
                }),
              },
              {
                label: 'Size fee',
                value: formatHubPaymentAmount(paymentOption, formQuote.sizeFeeKas, {
                  snapshot: pricingSnapshot,
                }),
              },
              ...formQuote.moduleLines.map((line) => ({
                label: line.title,
                value: `+${formatHubPaymentAmount(paymentOption, line.kas, { snapshot: pricingSnapshot })}`,
              })),
              ...(formQuote.modulesFeeKas > 0
                ? [
                    {
                      label: 'Modules subtotal',
                      value: formatHubPaymentAmount(paymentOption, formQuote.modulesFeeKas, {
                        snapshot: pricingSnapshot,
                      }),
                    },
                  ]
                : []),
              {
                label: 'Network buffer',
                value: formatHubPaymentAmount(paymentOption, formQuote.networkFeeBufferKas, {
                  snapshot: pricingSnapshot,
                }),
              },
              { label: 'Payload bytes', value: String(formQuote.payloadBytes) },
              { label: 'Chunk estimate', value: String(formQuote.chunkCount) },
            ]}
            totalDisplay={formatHubPaymentAmount(paymentOption, formQuote.totalKas, {
              snapshot: pricingSnapshot,
            })}
            currencies={buildKasKrexCurrencyOptions()}
            catalogEntries={buildPublicHubCurrencyCatalog({
              amountKas: formQuote.totalKas,
              pricingSnapshot,
              krexBalance: krexBalance,
              extra: {
                kcc20Tokens:
                  kcc20Selected?.covenantId
                    ? [
                        {
                          id: `kcc20:${kcc20Selected.covenantId}`,
                          label: kcc20Selected.ticker || kcc20Selected.name || 'KCC-20',
                          covenantId: kcc20Selected.covenantId,
                          ticker: kcc20Selected.ticker,
                          decimals: kcc20Selected.decimals ?? 8,
                        },
                      ]
                    : undefined,
              },
            })}
            selectedCurrencyId={paymentCurrency}
            onCurrencyChange={(id) => {
              setPaymentCurrency(id);
              const opt = buildKasKrexCurrencyOptions().find((c) => c.id === id);
              if (opt) setPaymentOption(opt);
            }}
            onCatalogSelect={(opt) => {
              setPaymentCurrency(opt.id);
              setPaymentOption(opt);
            }}
            splitLegs={
              paymentOption.kind === 'kas'
                ? (() => {
                    try {
                      return buildHubPlatformFeePlan({ totalKas: formQuote.totalKas }).legs;
                    } catch {
                      return undefined;
                    }
                  })()
                : undefined
            }
            tier={tier}
            krexBalance={krexBalance}
            discountNote={
              formQuote.discountKas > 0
                ? `KREX discount: -${formatHubPaymentAmount(paymentOption, formQuote.discountKas, {
                    snapshot: pricingSnapshot,
                  })} (${discountPercent}% off).`
                : undefined
            }
            infoText="One Kaspa L1 payment commits your listing payload on-chain. Fee rows update for the selected Pay with currency. KAS can split treasury + rewards in a single tx."
            hubPoints={
              isEditMode
                ? undefined
                : computeEarnedHubPoints(HUB_EARN_POINTS.tokenListingCreate, tier)
            }
            hubPointsBaseSpendKas={formQuote.subtotalKas}
            flowBusy={isSubmitting}
            footer={
              <>
                <button
                  type="submit"
                  disabled={isSubmitting || !canPublish}
                  className="w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Publishing…'
                    : `${isEditMode ? 'Update listing' : 'Publish listing'} (${formatHubPaymentAmount(
                        paymentOption,
                        formQuote.totalKas,
                        { snapshot: pricingSnapshot },
                      )})`}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="w-full k-control-btn"
                  disabled={isSubmitting}
                >
                  Preview Token Page
                </button>
              </>
            }
            alerts={
              error || (!canPublish && (walletAddress || isEvmConnected)) ? (
                <>
                  {error ? (
                    <Alert type="error" compact region>
                      Could not publish: {error}
                    </Alert>
                  ) : null}
                  {!canPublish && (walletAddress || isEvmConnected) ? (
                    <Alert type="info" compact region>
                      Connect Kasware (or another Kaspa L1 wallet) to pay the listing fee and verify on-chain.
                    </Alert>
                  ) : null}
                </>
              ) : null
            }
          />
          </HubAsideRail>
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
