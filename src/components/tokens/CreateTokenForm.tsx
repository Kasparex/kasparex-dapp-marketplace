'use client';

import { useMemo, useState } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { TokenPreviewModal } from '@/components/tokens/TokenPreviewModal';
import { TOKEN_MODULE_OFFERS } from '@/lib/tokens/modules';
import { estimateTokenPageQuote, TOKEN_LISTING_FEES } from '@/lib/tokens/pricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { getTokenModuleDiscountPercent } from '@/lib/tokens/modules';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { Token } from '@/lib/tokens/types';

const FORM_PANEL_CLASS =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm';

export function CreateTokenForm() {
  const { tier } = useKREXBalance();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [tags, setTags] = useState('');
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const discountPercent = krexTierDiscountPercent(tier);
  const moduleDiscountPercent = getTokenModuleDiscountPercent(tier);

  const tagsArray = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tags],
  );

  const previewToken: Token = useMemo(
    () => ({
      id: 'preview',
      slug: 'preview',
      symbol: symbol.trim() || 'TICK',
      name: name.trim() || 'Token name',
      description: description.trim() || 'Token description preview.',
      shortDescription: shortDescription.trim() || undefined,
      network: 'L2',
      type: 'collab',
      tags: tagsArray,
      listing: {
        verified: false,
        instantUtility: enabledModules.size > 0,
      },
    }),
    [symbol, name, description, shortDescription, tagsArray, enabledModules.size],
  );

  const formQuote = useMemo(() => {
    const modulePriceById = Object.fromEntries(
      TOKEN_MODULE_OFFERS.map((offer) => [offer.id, offer.unlockPriceKas]),
    );
    const quote = estimateTokenPageQuote({
      baseFeeKas: TOKEN_LISTING_FEES.createListingKas,
      moduleIds: Array.from(enabledModules),
      modulePriceById,
    });
    const subtotal = quote.baseFeeKas + quote.modulesFeeKas + quote.networkFeeBufferKas;
    const discountKas = (subtotal * discountPercent) / 100;
    return {
      ...quote,
      subtotalKas: Math.round(subtotal * 100) / 100,
      discountKas: Math.round(discountKas * 100) / 100,
      totalKas: Math.round((subtotal - discountKas) * 100) / 100,
    };
  }, [enabledModules, discountPercent]);

  const toggleModule = (id: string) => {
    setEnabledModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <form
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-6 min-w-0">
          <div className={`${FORM_PANEL_CLASS} space-y-6`}>
            <div>
              <DAppSectionHeader title="Main content" className="mb-3" />
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                Create Token Listing
              </h3>
              <p className="kx-body">
                List your token, verify ownership, and build a modular landing page. Estimated cost:{' '}
                {formQuote.totalKas} KAS.
              </p>
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
              />
            </div>
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
                priceLabel={`+${offer.unlockPriceKas} KAS`}
                checked={enabledModules.has(offer.id)}
                onToggle={() => toggleModule(offer.id)}
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
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formQuote.totalKas} KAS</p>
            </div>
            <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
              On-chain listing and module unlocks require a Kaspa L1 payment. Connect your wallet to continue when
              publishing goes live.
            </div>
            <button
              type="submit"
              disabled
              className="w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] opacity-50 cursor-not-allowed"
            >
              Publish listing (coming soon)
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="w-full k-control-btn"
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
