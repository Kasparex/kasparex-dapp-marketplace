'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useId } from 'react';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

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
  muted?: boolean;
  /** Short help on fabrication spec rows; omit on ingredient lines. */
  specTooltip?: string;
  color?: 'emerald' | 'amber' | 'rose' | 'sky' | 'zinc' | 'red' | 'accent';
};

function formatGameItemPriceAmount(currency: GameItemCurrency, amount: number): string {
  return amount.toLocaleString(undefined, {
    maximumFractionDigits: currency === 'KREX' ? 2 : 6,
    minimumFractionDigits: 0,
  });
}

export function GameItemCard(props: {
  icon?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  /** When set with `imageSrc`, the media image is clickable (e.g. open upgrade modal). */
  onMediaClick?: () => void;
  /** Hover hint when the plant image opens setup (Mining cards). */
  mediaTapTooltip?: React.ReactNode;
  /** Optional overlay in the media area. */
  mediaOverlay?: React.ReactNode;
  /** Optional bottom overlay (e.g. plant stat capsules). */
  mediaOverlayBottom?: React.ReactNode;
  /** Optional content aligned right in the title row (below media). */
  titleAccessory?: React.ReactNode;
  title: string;
  category: string;
  description: React.ReactNode;
  /** Blueprint-style split (e.g. Fabrication). When set, prefer over a flat `effects` list. */
  specifications?: GameItemEffectLine[];
  ingredients?: GameItemEffectLine[];
  effects?: GameItemEffectLine[];
  priceOptions: GameItemPriceOption[];
  defaultCurrency?: GameItemCurrency;
  hidePricing?: boolean;
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
  /**
   * Replaces the default `k-cta-games` buy button classes when set (e.g. Mining plant stop/resume styling).
   * Include sizing and disabled: styles you need; defaults apply when omitted.
   */
  buyButtonClassName?: string;
  /** When `hidePricing` is true, omit the footer primary button (e.g. action rendered inside `description`). */
  hideBuyButton?: boolean;
  onBuy: (args: { currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  /** When set (e.g. ingredient shop cards), shows count on the right of the title row. Gray when 0. */
  ownedCount?: number;
  /** Rendered below description / effect capsules, above the pricing footer (interactive controls OK). */
  belowEffects?: React.ReactNode;
}) {
  const options = props.priceOptions;
  const initialCurrency =
    props.defaultCurrency && options.some((o) => o.currency === props.defaultCurrency) ? props.defaultCurrency : options[0]?.currency;
  const [currency, setCurrency] = useState<GameItemCurrency>(initialCurrency ?? 'KAS');
  const qtyInputId = useId();

  const selected = useMemo(() => options.find((o) => o.currency === currency) ?? options[0], [options, currency]);

  const qtyCfg = props.quantitySelector;
  const qtyMin = qtyCfg?.min ?? 1;
  const qtyMax = qtyCfg?.max ?? 999;
  const controlledQty = qtyCfg?.value;
  const [uncontrolledQty, setUncontrolledQty] = useState(1);
  const qtyCommitted = Math.max(qtyMin, Math.min(qtyMax, controlledQty ?? uncontrolledQty));
  /** While focused, allow typed digits including empty-before-commit */
  const [qtyEditDraft, setQtyEditDraft] = useState<string | null>(null);

  const quantity = qtyCommitted;

  const unit = selected?.unitPrice ?? 0;
  const originalUnit = selected?.originalUnitPrice;
  const total = unit * quantity;
  const originalTotal = originalUnit != null ? originalUnit * quantity : undefined;
  const hasDiscount = originalTotal != null && originalTotal > total + 1e-9;

  const ownedInactive = props.ownedCount != null && props.ownedCount <= 0;
  const ownedBadgeClass = ownedInactive
    ? 'border-zinc-200 bg-zinc-100/90 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400'
    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';

  const priceText = `${formatGameItemPriceAmount(selected?.currency ?? currency, total)} ${selected?.currency ?? currency}`;

  function setQty(next: number) {
    const clamped = Math.max(qtyMin, Math.min(qtyMax, next));
    setQtyEditDraft(null);
    if (qtyCfg?.onChange) qtyCfg.onChange(clamped);
    else setUncontrolledQty(clamped);
  }

  function commitDraftAndBlur() {
    const raw = qtyEditDraft;
    setQtyEditDraft(null);
    if (raw === null) return;
    const t = raw.replace(/\D/g, '');
    if (t === '') {
      setQty(qtyCommitted);
      return;
    }
    const n = parseInt(t, 10);
    if (!Number.isFinite(n)) {
      setQty(qtyCommitted);
      return;
    }
    setQty(n);
  }

  function effectLineRow(e: GameItemEffectLine) {
    const row = (
      <div
        className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30"
      >
        <span className="font-semibold text-zinc-600 dark:text-zinc-400">{e.label}</span>
        <span
          className={`font-black tabular-nums ${
            e.muted
              ? 'text-zinc-500 dark:text-zinc-500'
              : e.color === 'amber'
                ? 'text-amber-700 dark:text-amber-300'
                : e.color === 'rose'
                  ? 'text-rose-700 dark:text-rose-300'
                  : e.color === 'red'
                    ? 'text-red-600 dark:text-red-400'
                    : e.color === 'sky'
                      ? 'text-sky-700 dark:text-sky-300'
                      : e.color === 'zinc'
                        ? 'text-zinc-700 dark:text-zinc-300'
                        : e.color === 'accent'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {e.value}
        </span>
      </div>
    );
    return e.specTooltip ? (
      <Tooltip key={e.label} content={gameTooltipRich(e.label, e.specTooltip)}>
        <div className="block cursor-help">{row}</div>
      </Tooltip>
    ) : (
      <div key={e.label}>{row}</div>
    );
  }

  let mainMedia: React.ReactNode;
  if (!props.imageSrc) {
    mainMedia = (
      <div className="flex h-12 w-12 items-center justify-center text-3xl text-zinc-400 dark:text-zinc-600">{props.icon ?? '⬡'}</div>
    );
  } else if (props.onMediaClick) {
    const imgBtn = (
      <button
        type="button"
        onClick={props.onMediaClick}
        className="absolute inset-0 z-[1] block h-full w-full cursor-pointer border-0 bg-transparent p-0"
        aria-label={props.imageAlt ?? props.title}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={props.imageSrc} alt="" className="pointer-events-none h-full w-full object-cover" />
      </button>
    );
    mainMedia = props.mediaTapTooltip ? <Tooltip content={props.mediaTapTooltip}>{imgBtn}</Tooltip> : imgBtn;
  } else {
    mainMedia = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={props.imageSrc} alt={props.imageAlt ?? props.title} className="h-full w-full object-cover" />
    );
  }

  return (
    <KxListingCard accent="games" className="relative flex min-h-0 flex-col">
      <KxListingCardMedia aspectClass="aspect-[3/2]">
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          {mainMedia}
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-20 flex justify-end">
          <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
            {props.category}
          </span>
        </div>
        {props.mediaOverlay ? (
          <div className="pointer-events-none absolute right-3 top-3 z-20 max-w-[55%] text-right sm:right-4 sm:top-4">{props.mediaOverlay}</div>
        ) : null}
        {props.mediaOverlayBottom ? (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex flex-wrap gap-1.5">{props.mediaOverlayBottom}</div>
        ) : null}
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100" title={props.title}>
            {props.title}
          </h3>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {props.ownedCount != null ? (
              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${ownedBadgeClass}`}
              >
                Owned · {props.ownedCount.toLocaleString()}
              </span>
            ) : null}
            {props.titleAccessory ? <div className="text-right">{props.titleAccessory}</div> : null}
          </div>
        </div>

        <div className="mb-4 min-h-0 flex-grow">
          <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.description}</div>

          {props.specifications && props.specifications.length > 0 ? (
            <div className="mt-3">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Specifications
              </div>
              <div className="grid gap-2">{props.specifications.map(effectLineRow)}</div>
            </div>
          ) : null}

          {props.ingredients && props.ingredients.length > 0 ? (
            <div className="mt-3">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Ingredients
              </div>
              <div className="grid gap-2">{props.ingredients.map(effectLineRow)}</div>
            </div>
          ) : null}

          {!props.specifications?.length && !props.ingredients?.length && props.effects && props.effects.length > 0 ? (
            <div className="mt-3 grid gap-2">{props.effects.map(effectLineRow)}</div>
          ) : null}

          {props.belowEffects ? <div className="mt-3">{props.belowEffects}</div> : null}
        </div>

        {props.hidePricing ? (
          props.hideBuyButton ? null : (
          <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void props.onBuy({ currency: selected?.currency ?? currency, quantity })}
              disabled={props.buyDisabled || Boolean(selected?.disabled)}
              className={
                props.buyButtonClassName ??
                'k-cta-games h-10 w-full px-4 disabled:opacity-50 disabled:grayscale'
              }
            >
              {props.buyLabel ?? 'Buy'}
            </button>
          </div>
          )
        ) : (
        <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800 space-y-3">
          <div className={`flex items-center justify-between gap-3 ${qtyCfg ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="k-control-icon-btn h-9 w-9"
                  onClick={() => setQty(qtyCommitted - 1)}
                  disabled={!qtyCfg || qtyCommitted <= qtyMin}
                >
                  −
                </button>
                <input
                  id={qtyInputId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Quantity (type custom amount)"
                  title="Type amount or use +/−"
                  disabled={!qtyCfg}
                  className="min-w-[3.25rem] max-w-[5.25rem] rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-center text-sm font-black tabular-nums text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100"
                  value={qtyEditDraft !== null ? qtyEditDraft : String(qtyCommitted)}
                  onFocus={() => {
                    if (!qtyCfg) return;
                    setQtyEditDraft(String(qtyCommitted));
                  }}
                  onChange={(e) => {
                    if (!qtyCfg) return;
                    const t = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setQtyEditDraft(t);
                  }}
                  onBlur={() => commitDraftAndBlur()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDraftAndBlur();
                  }}
                />
                <button
                  type="button"
                  className="k-control-icon-btn h-9 w-9"
                  onClick={() => setQty(qtyCommitted + 1)}
                  disabled={!qtyCfg || qtyCommitted >= qtyMax}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {options.length > 1 ? (
                <GameCurrencyMenu
                  ariaLabel="Payment currency"
                  value={String(currency)}
                  onChange={(v) => setCurrency(v as GameItemCurrency)}
                  options={options.map((o) => {
                    const t = (o.unitPrice ?? 0) * quantity;
                    const txt = `${formatGameItemPriceAmount(o.currency, t)} ${o.currency}`;
                    return { value: o.currency, label: txt, disabled: o.disabled };
                  })}
                  className="w-full sm:w-auto sm:flex-1 sm:min-w-[170px]"
                />
              ) : (
                <div className="k-control-btn h-10 w-full px-4 font-black tabular-nums sm:w-auto sm:flex-1">
                  {priceText}
                </div>
              )}

              <button
                type="button"
                onClick={() => void props.onBuy({ currency: selected?.currency ?? currency, quantity })}
                disabled={props.buyDisabled || Boolean(selected?.disabled)}
                className="k-cta-games h-10 w-full px-4 disabled:opacity-50 disabled:grayscale sm:w-auto sm:shrink-0"
              >
                {props.buyLabel ?? 'Buy'}
              </button>
            </div>
            {hasDiscount ? <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Discount applied</div> : null}
          </div>
        </div>
        )}
      </KxListingCardBody>
    </KxListingCard>
  );
}

