'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useId } from 'react';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import type { KxListingAccent } from '@/lib/ui/kxListingAccent';
import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';
import { HubPaymentCurrencyCatalogTrigger } from '@/components/payments/HubPaymentCurrencyCatalogModal';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { Tooltip } from '@/components/ui/Tooltip';
import { KxBadge } from '@/components/ui/KxBadge';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';

/** Qty input fill only (Pay With keeps its own border chrome). */
const QTY_INPUT_FILL = 'bg-zinc-50 dark:bg-zinc-950/50';

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

/** Display ticker: readable label for redeemable points. */
function formatCurrencyTicker(currency: GameItemCurrency): string {
  const s = String(currency);
  return s === 'PTS' || s.toLowerCase() === 'pts' ? 'points' : s;
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
  /** Rendered below the title row (e.g. author credit). */
  titleBelow?: ReactNode;
  description: React.ReactNode;
  /** Blueprint-style split (e.g. Fabrication). When set, prefer over a flat `effects` list. */
  specifications?: GameItemEffectLine[];
  /** When true, renders `specifications` below the pricing footer (Rewards catalog cards). */
  specificationsBelowPricing?: boolean;
  /** When true, suppresses the “Specifications” heading (rows still render). */
  hideSpecificationsHeading?: boolean;
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
  /** Overrides the left label above the +/- row (default: Quantity). */
  quantityLabel?: string;
  /** When `stacked`, the label sits on its own line above the stepper row. */
  quantityLabelLayout?: 'inline' | 'stacked';
  /** Omits the Points/Quantity label row (full-width stepper + Max). */
  hideQuantityLabel?: boolean;
  /** When set, hides the quantity stepper and uses this quantity for pricing / onBuy. */
  quantityLockedAt?: number;
  /**
   * When false, +/- / typed amount / Max stay visible when `quantitySelector` is set but are inactive (e.g. fixed-qty Rewards offers).
   * @default true
   */
  quantityControlsInteractive?: boolean;
  /** Max button fills quantity to the affordable maximum (games hub pattern). */
  showQuantityMaxButton?: boolean;
  /** Primary CTA text; overrides `buyLabel` when set (eg token pool totals). */
  primaryActionLabelBuilder?: (ctx: {
    quantity: number;
    pointsSpend: number;
    currency: GameItemCurrency;
  }) => string;
  /** Full-width column: total row, then CTA, then this (e.g. rate breakdown). */
  pricingActionsLayout?: 'split' | 'stacked';
  /** When set (single currency), replaces the calculation box body (e.g. pts → token summary). */
  pricingCalculationSummary?: (ctx: {
    quantity: number;
    pointsSpend: number;
    currency: GameItemCurrency;
  }) => ReactNode;
  pricingFooterExtra?: (ctx: {
    quantity: number;
    pointsSpend: number;
    currency: GameItemCurrency;
  }) => ReactNode;
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
  /**
   * Listing chrome accent (`data-kx-accent`). Rewards hub uses `hub` (turquoise hover) instead of games emerald.
   * @default 'games'
   */
  kxListingAccent?: KxListingAccent;
  onBuy: (args: { currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  /** Navigate to detail when clicking card body (pricing footer stops propagation). */
  onCardNavigate?: () => void;
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

  const lockedQtyProp = props.quantityLockedAt;
  const qtyCtlInteractive = props.quantityControlsInteractive !== false;
  const qtyCfg = lockedQtyProp != null ? undefined : props.quantitySelector;
  const qtyMin = qtyCfg?.min ?? 1;
  const qtyMax = qtyCfg?.max ?? 999;
  const controlledQty = qtyCfg?.value;
  const [uncontrolledQty, setUncontrolledQty] = useState(1);
  const qtyCommitted =
    lockedQtyProp != null
      ? Math.max(1, Math.floor(lockedQtyProp))
      : Math.max(qtyMin, Math.min(qtyMax, controlledQty ?? uncontrolledQty));
  /** While focused, allow typed digits including empty-before-commit */
  const [qtyEditDraft, setQtyEditDraft] = useState<string | null>(null);

  const quantity = qtyCommitted;

  const unit = selected?.unitPrice ?? 0;
  const originalUnit = selected?.originalUnitPrice;
  const total = unit * quantity;
  const originalTotal = originalUnit != null ? originalUnit * quantity : undefined;
  const hasDiscount = originalTotal != null && originalTotal > total + 1e-9;

  /** Catalog FX must always start from the KAS list price, never the selected token total. */
  const kasUnitPrice =
    options.find((o) => String(o.currency).toUpperCase() === 'KAS')?.unitPrice ??
    (String(selected?.currency ?? '').toUpperCase() === 'KAS' ? unit : 0);
  const amountKasForCatalog = Math.max(0, (kasUnitPrice ?? 0) * quantity);

  const listingAccent = props.kxListingAccent ?? 'games';
  const hubChrome = listingAccent === 'hub' || listingAccent === 'store';
  const currencyMenuAccent = hubChrome ? 'store' : 'default';
  /** Same border chrome as before; fill matches qty input only. */
  const currencyMenuButtonClass =
    `flex !h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200 ${QTY_INPUT_FILL} px-4 py-0 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900`;
  /** Keep k-control-btn border; override fill only. */
  const hubCurrencyTriggerClass = '!bg-zinc-50 hover:!bg-zinc-100 dark:!bg-zinc-950/50 dark:hover:!bg-zinc-900';
  const { catalogEntries: publicCatalog } = useHubPayWithCatalog({
    amountKas: amountKasForCatalog > 0 ? amountKasForCatalog : undefined,
  });
  const hubPayCatalog = useMemo(() => {
    // In-game cards use GameCurrencyMenu; hub/store keep the catalog modal.
    if (!hubChrome) return [] as HubCurrencyCatalogEntry[];
    const optionIds = new Set(options.map((o) => String(o.currency).toUpperCase()));
    const shopLabel = (currency: string): string | undefined => {
      const opt = options.find((o) => String(o.currency).toUpperCase() === currency.toUpperCase());
      if (opt?.unitPrice == null) return undefined;
      return `${formatGameItemPriceAmount(opt.currency, opt.unitPrice * quantity)} ${formatCurrencyTicker(opt.currency)}`;
    };
    const fromPublic = publicCatalog
      .filter((entry) => {
        if (entry.kind === 'kas' || entry.kind === 'krex') return optionIds.has(entry.id.toUpperCase());
        if (entry.kind === 'krc20' && entry.tick) {
          return optionIds.has(entry.tick.toUpperCase()) || optionIds.has(entry.id.toUpperCase());
        }
        return optionIds.has(entry.id.toUpperCase());
      })
      .map((entry) => {
        const tick = entry.tick ?? entry.id;
        const label = shopLabel(tick) ?? shopLabel(entry.id) ?? entry.amountLabel;
        return label ? { ...entry, amountLabel: label } : entry;
      });
    const extras: HubCurrencyCatalogEntry[] = options
      .filter((o) => !fromPublic.some((e) => e.id.toUpperCase() === String(o.currency).toUpperCase()))
      .map((o) => ({
        id: String(o.currency),
        label: o.label ?? String(o.currency),
        kind: 'krc20' as const,
        tick: String(o.currency),
        status: o.disabled ? ('locked' as const) : ('available' as const),
        detail: 'Shop currency',
        amountLabel:
          o.unitPrice != null
            ? `${formatGameItemPriceAmount(o.currency, o.unitPrice * quantity)} ${formatCurrencyTicker(o.currency)}`
            : undefined,
      }));
    return [...fromPublic, ...extras];
  }, [hubChrome, options, publicCatalog, quantity]);

  const handleHubCurrencySelect = (option: HubPaymentCurrencyOption) => {
    const id = option.tick ?? option.id;
    if (options.some((o) => String(o.currency).toUpperCase() === String(id).toUpperCase())) {
      setCurrency(id as GameItemCurrency);
      return;
    }
    if (option.kind === 'kas') setCurrency('KAS');
    else if (option.kind === 'krex') setCurrency('KREX');
    else setCurrency(option.id as GameItemCurrency);
  };
  const hideQuantityLabel = props.hideQuantityLabel ?? true;
  const specificationsBelowPricing = props.specificationsBelowPricing ?? false;
  void props.quantityLabelLayout;
  void props.pricingActionsLayout;

  const ownedInactive = props.ownedCount != null && props.ownedCount <= 0;

  const cur = selected?.currency ?? currency;
  const priceText = `${formatGameItemPriceAmount(cur, total)} ${formatCurrencyTicker(cur)}`;
  const summaryCtx = {
    quantity,
    pointsSpend: unit * quantity,
    currency: cur,
  };
  const calculationBoxBody = props.pricingCalculationSummary?.(summaryCtx) ?? priceText;

  function setQty(next: number) {
    if (lockedQtyProp != null || !qtyCtlInteractive) return;
    const clamped = Math.max(qtyMin, Math.min(qtyMax, next));
    setQtyEditDraft(null);
    if (qtyCfg?.onChange) qtyCfg.onChange(clamped);
    else setUncontrolledQty(clamped);
  }

  function commitDraftAndBlur() {
    if (!qtyCtlInteractive) {
      setQtyEditDraft(null);
      return;
    }
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

  const primaryCtaClass = hubChrome
    ? 'k-cta-primary flex !h-10 w-full items-center justify-center !px-4 !py-0 text-center text-xs disabled:opacity-50 disabled:grayscale sm:text-[13px]'
    : 'k-cta-games flex !h-10 w-full items-center justify-center !px-4 !py-0 text-center text-xs disabled:opacity-50 disabled:grayscale sm:text-[13px]';

  const qtyAriaLabel = hideQuantityLabel ? 'Amount' : props.quantityLabel ?? 'Quantity';

  const calculationBoxClass =
    `flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 px-3 text-center text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 ${QTY_INPUT_FILL}`;

  function qtyStepper(opts?: { showMax?: boolean }) {
    const stepDisabled = !qtyCfg || !qtyCtlInteractive;
    const showMax = opts?.showMax ?? Boolean(props.showQuantityMaxButton && qtyCfg);
    return (
      <div className="flex h-10 shrink-0 items-stretch overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          className="inline-flex w-9 shrink-0 items-center justify-center border-r border-zinc-200 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          onClick={() => setQty(qtyCommitted - 1)}
          disabled={stepDisabled || qtyCommitted <= qtyMin}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          id={qtyInputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`${qtyAriaLabel} (type custom amount)`}
          title="Type amount or use +/−"
          disabled={stepDisabled}
          className={`h-full w-12 shrink-0 border-0 px-1 text-center text-sm font-black tabular-nums text-zinc-900 outline-none disabled:opacity-50 dark:text-zinc-100 ${QTY_INPUT_FILL}`}
          value={qtyEditDraft !== null ? qtyEditDraft : String(qtyCommitted)}
          onFocus={() => {
            if (!qtyCfg) return;
            setQtyEditDraft(String(qtyCommitted));
          }}
          onChange={(e) => {
            if (!qtyCfg) return;
            const t = e.target.value.replace(/\D/g, '').slice(0, 9);
            setQtyEditDraft(t);
          }}
          onBlur={() => commitDraftAndBlur()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraftAndBlur();
          }}
        />
        <button
          type="button"
          className="inline-flex w-9 shrink-0 items-center justify-center border-l border-zinc-200 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          onClick={() => setQty(qtyCommitted + 1)}
          disabled={stepDisabled || qtyCommitted >= qtyMax}
          aria-label="Increase quantity"
        >
          +
        </button>
        {showMax ? (
          <button
            type="button"
            className="inline-flex shrink-0 items-center border-l border-zinc-200 px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            disabled={stepDisabled || qtyMax <= qtyMin}
            onClick={() => setQty(qtyMax)}
          >
            Max
          </button>
        ) : null}
      </div>
    );
  }

  const currencyPicker =
    options.length > 1 ? (
      hubPayCatalog.length > 0 ? (
        <div className="min-w-0 w-full">
          <HubPaymentCurrencyCatalogTrigger
            entries={hubPayCatalog}
            selectedId={String(currency)}
            onSelect={handleHubCurrencySelect}
            accent={hubChrome ? 'store' : 'default'}
            className={hubCurrencyTriggerClass}
          />
        </div>
      ) : (
        <GameCurrencyMenu
          ariaLabel="Payment currency"
          value={String(currency)}
          onChange={(v) => setCurrency(v as GameItemCurrency)}
          options={options.map((o) => {
            const t = (o.unitPrice ?? 0) * quantity;
            const txt = `${formatGameItemPriceAmount(o.currency, t)} ${formatCurrencyTicker(o.currency)}`;
            return { value: o.currency, label: txt, disabled: o.disabled };
          })}
          className="min-w-0 w-full"
          accent={currencyMenuAccent}
          buttonClassName={currencyMenuButtonClass}
        />
      )
    ) : null;

  return (
    <KxListingCard accent={listingAccent} className="relative flex min-h-0 flex-col" onClick={props.onCardNavigate}>
      <KxListingCardMedia aspectClass="aspect-video">
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          {mainMedia}
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-20 flex justify-end">
          <KxBadge variant={hubChrome ? 'cyan' : 'emerald'}>{props.category}</KxBadge>
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
              <KxBadge variant={ownedInactive ? 'zinc' : hubChrome ? 'cyan' : 'emerald'}>
                Owned · {props.ownedCount.toLocaleString()}
              </KxBadge>
            ) : null}
            {props.titleAccessory ? <div className="text-right">{props.titleAccessory}</div> : null}
          </div>
        </div>

        {props.titleBelow ? <div className="mb-3 min-w-0">{props.titleBelow}</div> : null}

        <div className="mb-4 min-h-0 flex-grow">
          <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.description}</div>

          {props.specifications && props.specifications.length > 0 && !specificationsBelowPricing ? (
            <div className="mt-3">
              {!props.hideSpecificationsHeading ? (
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Specifications
                </div>
              ) : null}
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
                (hubChrome
                  ? 'k-cta-primary flex h-10 w-full items-center justify-center px-4 text-center disabled:opacity-50 disabled:grayscale'
                  : 'k-cta-games flex h-10 w-full items-center justify-center px-4 text-center disabled:opacity-50 disabled:grayscale')
              }
            >
              {props.buyLabel ?? 'Buy'}
            </button>
          </div>
          )
        ) : (
        <div
          className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800 space-y-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div className="flex flex-col gap-2">
            {lockedQtyProp == null && qtyCfg ? (
              <div className={`flex w-full items-center gap-2 ${qtyCtlInteractive ? '' : 'opacity-60'}`}>
                {qtyStepper({ showMax: Boolean(props.showQuantityMaxButton) })}
                <div className="min-w-0 flex-1">
                  {currencyPicker ?? <div className={calculationBoxClass}>{calculationBoxBody}</div>}
                </div>
              </div>
            ) : (
              currencyPicker ?? <div className={calculationBoxClass}>{calculationBoxBody}</div>
            )}

            <button
              type="button"
              onClick={() => void props.onBuy({ currency: cur, quantity })}
              disabled={props.buyDisabled || Boolean(selected?.disabled)}
              className={
                props.buyButtonClassName
                  ? `${props.buyButtonClassName} !h-10 w-full !py-0`
                  : primaryCtaClass
              }
            >
              {props.buyLabel === 'Locked'
                ? 'Locked'
                : props.primaryActionLabelBuilder
                  ? props.primaryActionLabelBuilder(summaryCtx)
                  : props.buyLabel ?? 'Buy'}
            </button>
            {props.pricingFooterExtra ? (
              <div className="text-center">{props.pricingFooterExtra(summaryCtx)}</div>
            ) : null}
            {hasDiscount ? (
              <div
                className={
                  hubChrome
                    ? 'text-[11px] font-semibold text-[#0097b2] dark:text-cyan-300'
                    : 'text-[11px] font-semibold text-emerald-700 dark:text-emerald-300'
                }
              >
                Discount applied
              </div>
            ) : null}
          </div>
        </div>
        )}
        {specificationsBelowPricing && props.specifications && props.specifications.length > 0 ? (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {!props.hideSpecificationsHeading ? (
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Specifications
              </div>
            ) : null}
            <div className="grid gap-2">{props.specifications.map(effectLineRow)}</div>
          </div>
        ) : null}
      </KxListingCardBody>
    </KxListingCard>
  );
}

