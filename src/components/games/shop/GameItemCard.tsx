'use client';

import { useMemo, useState } from 'react';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

export type GameItemCurrency = 'KAS' | 'KREX' | 'GRID' | 'TICKET' | string;

export type GameItemPriceOption = {
  currency: GameItemCurrency;
  /** Price per 1 unit (already discounted). */
  unitPrice: number;
  /** Optional original unit price (for strikethrough). */
  originalUnitPrice?: number;
  /** Optional label override (defaults to currency). */
  label?: string;
  /** Disable option (eg missing balance / unsupported wallet). */
  disabled?: boolean;
};

export type GameItemEffectLine = {
  label: string;
  value: string;
};

export function GameItemCard(props: {
  icon?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  category: string;
  description: React.ReactNode;
  effects?: GameItemEffectLine[];
  priceOptions: GameItemPriceOption[];
  defaultCurrency?: GameItemCurrency;
  /** Show quantity selector (eg inventory consumables). */
  quantitySelector?: {
    value?: number;
    min?: number;
    max?: number;
    onChange?: (next: number) => void;
  };
  /** Disable buy button (eg payment unavailable). */
  buyDisabled?: boolean;
  buyLabel?: string;
  onBuy: (args: { currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
}) {
  const options = props.priceOptions;
  const initialCurrency =
    props.defaultCurrency && options.some((o) => o.currency === props.defaultCurrency) ? props.defaultCurrency : options[0]?.currency;
  const [currency, setCurrency] = useState<GameItemCurrency>(initialCurrency ?? 'KAS');

  const selected = useMemo(() => options.find((o) => o.currency === currency) ?? options[0], [options, currency]);

  const qtyCfg = props.quantitySelector;
  const qtyMin = qtyCfg?.min ?? 1;
  const qtyMax = qtyCfg?.max ?? 999;
  const controlledQty = qtyCfg?.value;
  const [uncontrolledQty, setUncontrolledQty] = useState(1);
  const quantity = Math.max(qtyMin, Math.min(qtyMax, controlledQty ?? uncontrolledQty));

  const unit = selected?.unitPrice ?? 0;
  const originalUnit = selected?.originalUnitPrice;
  const total = unit * quantity;
  const originalTotal = originalUnit != null ? originalUnit * quantity : undefined;
  const hasDiscount = originalTotal != null && originalTotal > total + 1e-9;

  const priceText = `${total.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${selected?.currency ?? currency}`;

  function setQty(next: number) {
    const clamped = Math.max(qtyMin, Math.min(qtyMax, next));
    if (qtyCfg?.onChange) qtyCfg.onChange(clamped);
    else setUncontrolledQty(clamped);
  }

  return (
    <KxListingCard accent="games" className="relative flex min-h-0 flex-col">
      <KxListingCardMedia aspectClass="aspect-[3/2]">
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          {props.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.imageSrc} alt={props.imageAlt ?? props.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center text-3xl text-zinc-400 dark:text-zinc-600">{props.icon ?? '⬡'}</div>
          )}
        </div>

        <div className="pointer-events-none absolute left-4 top-4 z-20">
          <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
            {props.category}
          </span>
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100" title={props.title}>
            {props.title}
          </h3>
        </div>

        <div className="mb-4 min-h-0 flex-grow">
          <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.description}</div>

          {props.effects && props.effects.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {props.effects.map((e) => (
                <div key={e.label} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">{e.label}</span>
                  <span className="font-black tabular-nums text-emerald-700 dark:text-emerald-300">{e.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800 space-y-3">
          {qtyCfg ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Quantity</span>
              <div className="flex items-center gap-2">
                <button type="button" className="k-control-icon-btn h-9 w-9" onClick={() => setQty(quantity - 1)} disabled={quantity <= qtyMin}>
                  −
                </button>
                <div className="min-w-[3.5rem] text-center text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">{quantity}</div>
                <button type="button" className="k-control-icon-btn h-9 w-9" onClick={() => setQty(quantity + 1)} disabled={quantity >= qtyMax}>
                  +
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {hasDiscount ? (
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Discount applied</div>
              ) : (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500">&nbsp;</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {options.length > 1 ? (
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="k-filter-select k-price-select h-10 min-w-[170px]"
                >
                  {options.map((o) => {
                    const t = (o.unitPrice ?? 0) * quantity;
                    const txt = `${t.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${o.currency}`;
                    return (
                      <option key={o.currency} value={o.currency} disabled={o.disabled}>
                        {txt}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="k-control-btn h-10 px-4 font-black tabular-nums">
                  {priceText}
                </div>
              )}

              <button
                type="button"
                onClick={() => void props.onBuy({ currency: selected?.currency ?? currency, quantity })}
                disabled={props.buyDisabled || Boolean(selected?.disabled)}
                className="k-cta-games h-10 px-4 disabled:opacity-50 disabled:grayscale"
              >
                {props.buyLabel ?? 'Buy'}
              </button>
            </div>
          </div>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}

