'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

export type GameDeckResource = {
  id: string;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  description?: string;
  tooltip?: string;
  icon?: ReactNode;
  accent?: 'games' | 'kas' | 'krex' | 'grid' | 'diamonds' | 'purple';
  onClick?: () => void;
  /** Force full-width row in smart layout (e.g. refine controls). */
  fullWidth?: boolean;
};

function accentValueClass(accent?: GameDeckResource['accent']) {
  if (accent === 'kas') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'krex') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'grid') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'diamonds') return 'text-blue-500 dark:text-blue-400';
  if (accent === 'purple') return 'text-purple-500 dark:text-purple-400';
  return 'text-emerald-700 dark:text-emerald-300';
}

function isWideDeckResource(r: GameDeckResource): boolean {
  if (r.fullWidth) return true;
  if (typeof r.value !== 'string' && typeof r.value !== 'number' && r.value != null) return true;
  if ((r.description?.trim().length ?? 0) >= 48) return true;
  return false;
}

/**
 * Game Deck / Token Deck capsules.
 * - `stack`: always one column (Games halo).
 * - `smart`: 2-up for short rows; controls / long copy span full width.
 */
export function GameDeckResourceRows({
  resources,
  className = '',
  bordered: _bordered = true,
  layout = 'smart',
}: {
  resources: GameDeckResource[];
  className?: string;
  bordered?: boolean;
  layout?: 'stack' | 'smart';
}) {
  if (resources.length === 0) return null;
  const grid =
    layout === 'stack'
      ? 'grid grid-cols-1 items-stretch gap-2'
      : 'grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2';

  return (
    <ul className={`${grid} ${className}`.trim()}>
      {resources.map((r) => {
        const clickable = typeof r.onClick === 'function';
        const Row = clickable ? 'button' : 'div';
        const Wrapper = r.tooltip ? Tooltip : null;
        const wrapperProps = r.tooltip ? ({ content: gameTooltipRich(r.label, r.tooltip) } as const) : null;
        const wide = layout === 'smart' && isWideDeckResource(r);

        const innerContent = (
          <>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2 text-sm leading-tight">
                {r.icon ? (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400">
                    {r.icon}
                  </span>
                ) : null}
                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{r.label}</span>
              </div>
              {r.description ? (
                <div className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                  {r.description}
                </div>
              ) : null}
            </div>
            <div className="flex min-h-[2.75rem] shrink-0 flex-col items-end justify-center gap-0.5 text-right">
              <div
                className={
                  typeof r.value === 'string' || typeof r.value === 'number'
                    ? `text-sm font-black tabular-nums leading-none ${accentValueClass(r.accent)}`
                    : 'flex items-center leading-none'
                }
              >
                {r.value}
              </div>
              {r.subValue ? (
                <div className="text-[11px] font-semibold leading-snug text-zinc-500 dark:text-zinc-400">
                  {r.subValue}
                </div>
              ) : null}
            </div>
          </>
        );

        const rowClassName = [
          'kx-metadata-stat-card flex h-full min-h-[3.25rem] w-full flex-row items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-left dark:border-zinc-800 dark:bg-white/[0.06]',
          clickable ? 'cursor-pointer' : '',
        ].join(' ');

        const cell = Wrapper ? (
          <Wrapper {...wrapperProps!}>
            <Row type={clickable ? 'button' : undefined} onClick={r.onClick} className={rowClassName}>
              {innerContent}
            </Row>
          </Wrapper>
        ) : (
          <Row type={clickable ? 'button' : undefined} onClick={r.onClick} className={rowClassName}>
            {innerContent}
          </Row>
        );

        return (
          <li key={r.id} className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`.trim()}>
            {cell}
          </li>
        );
      })}
    </ul>
  );
}

/** Modal explaining each Game Deck capsule as a visual flow */
function DeckInfoModal({ onClose }: { onClose: () => void }) {
  const items = [
    { emoji: '💎', label: 'In-game currency', desc: 'Currency earned inside the game (diamonds, tickets, score weight). Spend or refine it in-game.' },
    { emoji: '✨', label: 'Redeem points', desc: 'Redeemable points from refining or clearing goals. Use them for tickets, hub rewards, and cross-game bridges.' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          aria-label="Close deck info"
        >
          ✕
        </button>

        <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">Game Deck - How it works</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          The deck tracks your key resources. Values update live as you play.
        </p>

        <div className="mt-5 space-y-3">
          {items.map((item, i) => (
            <div key={item.label} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-base dark:border-zinc-700 dark:bg-zinc-800">
                {item.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.label}</p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.desc}</p>
              </div>
              {i < items.length - 1 && (
                <div className="pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-zinc-600 dark:text-zinc-400">
          <strong className="text-emerald-700 dark:text-emerald-300">Loop:</strong>{' '}
          Play → Earn Reward Weight → Snapshot → Claim GRID on L2 via{' '}
          <a href="/rewards" className="underline text-emerald-700 dark:text-emerald-300">Rewards &amp; Points</a>.
        </div>
      </div>
    </div>
  );
}

export function GameDeckPanel(props: {
  title?: string;
  resources: GameDeckResource[];
  footer?: ReactNode;
  featured?: {
    image?: string;
    onOpenOverview?: () => void;
    tooltip?: string;
  };
  /** When false (e.g. Minecore), hide the Deck “i” modal trigger. Defaults true. */
  showDeckHelpButton?: boolean;
  /** Prepends a standard "Reward Weight / Combined reward potential" capsule */
  rewardWeight?: { value: string; subValue?: string; onClick?: () => void };
}) {
  const [deckInfoOpen, setDeckInfoOpen] = useState(false);

  // Prepend standard reward weight capsule if provided and not already present
  const resources: GameDeckResource[] = [
    ...(props.rewardWeight && !props.resources.some((r) => r.id === 'reward_weight')
      ? [{
          id: 'reward_weight',
          label: 'Reward Weight',
          value: props.rewardWeight.value,
          subValue: props.rewardWeight.subValue,
          description: 'Combined reward potential',
          tooltip:
            'Your total reward weight decides your share of GRID distribution when snapshots run. Tap this row to view details.',
          accent: 'diamonds' as const,
          onClick: props.rewardWeight.onClick,
        }]
      : []),
    ...props.resources,
  ];

  const showDeckHelp = props.showDeckHelpButton !== false;

  return (
    <>
      {showDeckHelp && deckInfoOpen && <DeckInfoModal onClose={() => setDeckInfoOpen(false)} />}
      <GamePanelCard
        title={props.title ?? 'Game Deck'}
        hint="Values update live as you play."
        right={
          showDeckHelp ? (
            <button
              type="button"
              onClick={() => setDeckInfoOpen(true)}
              aria-label="About Game Deck capsules"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            >
              i
            </button>
          ) : undefined
        }
      >
        {props.featured?.image ? (
          <div className="mb-4">
            <Tooltip
              content={gameTooltipRich(
                'Featured',
                props.featured.tooltip ?? 'Tap to open the game overview or spotlight for this title.',
              )}
            >
              <button
                type="button"
                onClick={() => props.featured?.onOpenOverview?.()}
                disabled={!props.featured?.onOpenOverview}
                className="group relative block w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 disabled:cursor-default dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={props.featured.image}
                  alt="Featured"
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              </button>
            </Tooltip>
          </div>
        ) : null}

        <GameDeckResourceRows resources={resources} bordered={false} layout="stack" />

        {props.footer ? <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">{props.footer}</div> : null}
      </GamePanelCard>
    </>
  );
}
