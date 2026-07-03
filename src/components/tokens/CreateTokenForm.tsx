'use client';

import { useMemo, useState } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { TokenPreviewModal } from '@/components/tokens/TokenPreviewModal';
import { TOKEN_MODULE_OFFERS, type TokenModuleId } from '@/lib/tokens/modules';
import { estimateTokenPageQuote, TOKEN_LISTING_FEES } from '@/lib/tokens/pricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { getTokenModuleDiscountPercent } from '@/lib/tokens/modules';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { Token, TokenNetwork } from '@/lib/tokens/types';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { TOKEN_PAGE_SECTION_LABELS } from '@/lib/tokens/pageConfig';
import type { TokenPageSectionType } from '@/lib/tokens/listingRecord';
import { useTokens } from '@/hooks/useTokens';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { Alert } from '@/components/Alert';

const FORM_PANEL_CLASS =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm';

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

interface CreateTokenFormProps {
  listing?: PublishedTokenListing | null;
  onSuccess?: (listing: PublishedTokenListing) => void;
  onCancelEdit?: () => void;
}

export function CreateTokenForm({ listing, onSuccess, onCancelEdit }: CreateTokenFormProps) {
  const isEditMode = Boolean(listing);
  const { tier } = useKREXBalance();
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { publishNewListing, updateExistingListing, discountPercent } = useTokens();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const canPublish = kaspaState.isConnected && Boolean(kaspaState.address);

  const [symbol, setSymbol] = useState(listing?.symbol ?? '');
  const [name, setName] = useState(listing?.name ?? '');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [shortDescription, setShortDescription] = useState(listing?.shortDescription ?? '');
  const [tags, setTags] = useState((listing?.tags ?? []).join(', '));
  const [network, setNetwork] = useState<TokenNetwork>(listing?.network ?? 'L2');
  const [contractAddress, setContractAddress] = useState(listing?.contractAddress ?? '');
  const [enabledModules, setEnabledModules] = useState<Set<string>>(
    () => new Set(listing?.paidModuleIds ?? []),
  );
  const [sectionToggles, setSectionToggles] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const section of listing?.pageConfig?.sections ?? []) {
      map[section.type] = section.enabled;
    }
    return map;
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierDiscount = krexTierDiscountPercent(tier);
  const moduleDiscountPercent = getTokenModuleDiscountPercent(tier);

  const tagsArray = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tags],
  );

  const previewToken: Token = useMemo(
    () => ({
      id: listing?.id ?? 'preview',
      slug: listing?.slug ?? 'preview',
      symbol: symbol.trim() || 'TICK',
      name: name.trim() || 'Token name',
      description: description.trim() || 'Token description preview.',
      shortDescription: shortDescription.trim() || undefined,
      network,
      contractAddress: contractAddress.trim() || undefined,
      type: 'collab',
      tags: tagsArray,
      listing: {
        verified: false,
        instantUtility: enabledModules.has('utility_integrations'),
        featured: enabledModules.has('featured_listing'),
      },
    }),
    [symbol, name, description, shortDescription, tagsArray, enabledModules, network, contractAddress, listing],
  );

  const formQuote = useMemo(() => {
    const modulePriceById = Object.fromEntries(
      TOKEN_MODULE_OFFERS.map((offer) => [offer.id, offer.unlockPriceKas]),
    );
    const newModuleIds = Array.from(enabledModules).filter(
      (id) => !listing?.paidModuleIds?.includes(id as TokenModuleId),
    );
    const quote = estimateTokenPageQuote({
      baseFeeKas: isEditMode ? TOKEN_LISTING_FEES.updateListingKas : TOKEN_LISTING_FEES.createListingKas,
      moduleIds: isEditMode ? newModuleIds : Array.from(enabledModules),
      modulePriceById,
    });
    const subtotal = quote.baseFeeKas + quote.modulesFeeKas + quote.networkFeeBufferKas;
    const discountKas = (subtotal * tierDiscount) / 100;
    return {
      ...quote,
      subtotalKas: Math.round(subtotal * 100) / 100,
      discountKas: Math.round(discountKas * 100) / 100,
      totalKas: Math.round((subtotal - discountKas) * 100) / 100,
    };
  }, [enabledModules, tierDiscount, isEditMode, listing?.paidModuleIds]);

  const toggleModule = (id: string) => {
    setEnabledModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (id === 'roadmap_editor') {
      setSectionToggles((prev) => ({ ...prev, roadmap: true }));
    }
    if (id === 'utility_integrations') {
      setSectionToggles((prev) => ({ ...prev, utility: true }));
    }
  };

  const toggleSection = (type: TokenPageSectionType) => {
    setSectionToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handlePublish = async () => {
    setError(null);
    if (!symbol.trim() || !name.trim() || !shortDescription.trim()) {
      setError('Ticker, name, and short description are required.');
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

    setIsSubmitting(true);
    try {
      const input = {
        symbol: symbol.trim(),
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        tags: tagsArray,
        network,
        contractAddress: contractAddress.trim() || undefined,
        enabledModuleIds: Array.from(enabledModules) as TokenModuleId[],
        sectionToggles,
      };
      const result = listing
        ? await updateExistingListing(listing.id, input, kaspaState.address!)
        : await publishNewListing(input, kaspaState.address!);
      if (!result) throw new Error('Failed to save listing');
      onSuccess?.(result);
      if (!isEditMode) {
        setSymbol('');
        setName('');
        setDescription('');
        setShortDescription('');
        setTags('');
        setContractAddress('');
        setEnabledModules(new Set());
        setSectionToggles({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className={`${FORM_PANEL_CLASS} space-y-6`}>
            <div>
              <DAppSectionHeader title="Main content" className="mb-3" />
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                {isEditMode ? 'Edit Token Listing' : 'Create Token Listing'}
              </h3>
              <p className="kx-body">
                {isEditMode
                  ? `Update your landing page. Estimated cost: ${formQuote.totalKas} KAS.`
                  : `List your token, verify ownership, and build a modular landing page. Estimated cost: ${formQuote.totalKas} KAS.`}
                {discountPercent > 0 ? ` KREX tier discount: ${discountPercent}%.` : ''}
              </p>
              {isEditMode && onCancelEdit ? (
                <button type="button" onClick={onCancelEdit} className="mt-3 text-sm text-[#02abb8] hover:underline">
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <KxFormFieldLabel>
                  Network <span className="text-red-500">*</span>
                </KxFormFieldLabel>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as TokenNetwork)}
                  className="k-input text-base mt-2 w-full"
                >
                  <option value="L2">L2 (Kasplex / EVM)</option>
                  <option value="L1">L1 (Kaspa KRC-20)</option>
                </select>
              </div>
              <div>
                <KxFormFieldLabel>Contract / ticker address</KxFormFieldLabel>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x… or KRC-20 address"
                  className="k-input text-base mt-2"
                />
              </div>
            </div>

            <div>
              <KxFormFieldLabel>
                Ticker symbol <span className="text-red-500">*</span>
              </KxFormFieldLabel>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. KREX"
                className="k-input text-base mt-2"
                required
                disabled={isSubmitting || isEditMode}
              />
            </div>

            <div>
              <KxFormFieldLabel>
                Token name <span className="text-red-500">*</span>
              </KxFormFieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full token name"
                className="k-input text-base mt-2"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <KxFormFieldLabel>
                Short description <span className="text-red-500">*</span>
              </KxFormFieldLabel>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-line summary for cards and search"
                rows={2}
                className="k-input text-base w-full resize-y min-h-[3rem] mt-2"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <KxFormFieldLabel>About this token</KxFormFieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full description for your landing page"
                rows={6}
                className="k-input text-base w-full resize-y min-h-[8rem] mt-2"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <KxFormFieldLabel>Tags (comma-separated)</KxFormFieldLabel>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="defi, governance, utility"
                className="k-input mt-2"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={`${FORM_PANEL_CLASS} space-y-3`} id="tokens-dashboard-sections">
            <DAppSectionHeader title="Page sections" className="mb-1" />
            <p className="kx-body-sm">Choose which tabs and blocks appear on your public token page.</p>
            {PAGE_SECTION_TYPES.map((type) => (
              <KxInFormPremiumRow
                key={type}
                flat
                title={TOKEN_PAGE_SECTION_LABELS[type]}
                description={
                  type === 'overview' || type === 'comments'
                    ? 'Recommended for all listings'
                    : 'Optional block on your landing page'
                }
                priceLabel=""
                checked={sectionToggles[type] ?? (type === 'overview' || type === 'comments' || type === 'links')}
                onToggle={() => toggleSection(type)}
              />
            ))}
          </div>

          <div className={`${FORM_PANEL_CLASS} space-y-4`} id="tokens-dashboard-modules">
            <DAppSectionHeader title="Premium modules" className="mb-1" />
            <p className="kx-body-sm">
              Unlock roadmap editors, Hub integrations, analytics, and featured placement.
              {moduleDiscountPercent > 0 ? ` KREX tier discount: ${moduleDiscountPercent}% off modules.` : ''}
            </p>
            {TOKEN_MODULE_OFFERS.map((offer) => (
              <KxInFormPremiumRow
                key={offer.id}
                flat
                title={offer.title}
                description={offer.description}
                priceLabel={
                  listing?.paidModuleIds?.includes(offer.id) ? 'Paid' : `+${offer.unlockPriceKas} KAS`
                }
                checked={enabledModules.has(offer.id)}
                onToggle={() => toggleModule(offer.id)}
                disabled={listing?.paidModuleIds?.includes(offer.id)}
              />
            ))}
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
              {formQuote.moduleLines.map((line) => (
                <div key={line.id} className="flex justify-between gap-2">
                  <span className="truncate">{line.title}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">+{line.kas} KAS</span>
                </div>
              ))}
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
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formQuote.totalKas} KAS</p>
            </div>
            <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
              Listing payment is sent on Kaspa L1 to the Kasparex treasury. Verification confirms amount, payer, and
              payload binding.
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
      <TokenPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} token={previewToken} />
    </>
  );
}
