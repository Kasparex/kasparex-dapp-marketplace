'use client';

import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import type { TokenMarketEntry } from '@/lib/tokens/modules';
import { kronMarketEntry } from '@/lib/programmable/kron';
import { contentForRichEditor } from '@/lib/richText/html';

function emptyMarket(): TokenMarketEntry {
  return { name: '', description: '', url: '', venueType: 'dex' };
}

type TokenMarketsEditorProps = {
  markets: TokenMarketEntry[];
  onChange: (markets: TokenMarketEntry[]) => void;
  disabled?: boolean;
  /** When set, shows one-click KRON market prefill. */
  covenantId?: string | null;
};

export function TokenMarketsEditor({
  markets,
  onChange,
  disabled,
  covenantId,
}: TokenMarketsEditorProps) {
  const items = markets.length > 0 ? markets : [emptyMarket()];
  const hasKron = items.some(
    (m) =>
      m.url.toLowerCase().includes('kron.technology/token/') ||
      m.name.trim().toLowerCase() === 'kron',
  );

  const update = (index: number, patch: Partial<TokenMarketEntry>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addKronMarket = () => {
    if (!covenantId || hasKron) return;
    const kron = kronMarketEntry(covenantId);
    const filled = items.filter((m) => m.name.trim() || m.url.trim());
    onChange([...filled, kron]);
  };

  return (
    <div className="space-y-4">
      {covenantId ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Link the KRON L1 launchpad / DEX trade page for this covenant.
          </p>
          <button
            type="button"
            disabled={disabled || hasKron || items.length >= 20}
            onClick={addKronMarket}
            className={`${KX_FORM_ADD_BTN_CLASS} mt-2 disabled:opacity-50`}
          >
            {hasKron ? 'KRON market already added' : 'Add KRON market'}
          </button>
        </div>
      ) : null}

      {items.map((market, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-800/40 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Market {index + 1}</p>
            <button
              type="button"
              disabled={disabled || items.length <= 1}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
            >
              Remove
            </button>
          </div>

          <div>
            <KxFormFieldLabel>Market name</KxFormFieldLabel>
            <input
              type="text"
              className="k-input mt-1 w-full"
              placeholder="e.g. KRON"
              value={market.name}
              disabled={disabled}
              onChange={(e) => update(index, { name: e.target.value })}
            />
          </div>

          <div>
            <KxFormFieldLabel>Short description</KxFormFieldLabel>
            <KxRichTextEditor
              value={contentForRichEditor(market.description)}
              onChange={(description) => update(index, { description })}
              placeholder="Brief description of this marketplace listing"
              minRows={3}
              disabled={disabled}
            />
          </div>

          <div>
            <KxFormFieldLabel>Marketplace URL</KxFormFieldLabel>
            <input
              type="url"
              className="k-input mt-1 w-full"
              placeholder="https://"
              value={market.url}
              disabled={disabled}
              onChange={(e) => update(index, { url: e.target.value })}
            />
          </div>

          <div>
            <KxFormFieldLabel>Venue type</KxFormFieldLabel>
            <div className="mt-2">
              <KxSegmentToggle
                value={market.venueType}
                onChange={(venueType) => !disabled && update(index, { venueType })}
                options={[
                  { value: 'cex', label: 'CEX' },
                  { value: 'dex', label: 'DEX' },
                ]}
                ariaLabel={`Market ${index + 1} venue type`}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled || items.length >= 20}
        onClick={() => onChange([...items, emptyMarket()])}
        className={KX_FORM_ADD_BTN_CLASS}
      >
        Add market
      </button>
    </div>
  );
}
