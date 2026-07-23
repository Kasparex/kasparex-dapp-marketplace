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
};

function accentValueClass(accent?: GameDeckResource['accent']) {
  if (accent === 'kas') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'krex') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'grid') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'diamonds') return 'text-blue-500 dark:text-blue-400';
  if (accent === 'purple') return 'text-purple-500 dark:text-purple-400';
  return 'text-emerald-700 dark:text-emerald-300';
}

/** Resource rows used in Game Deck panel and in-game Halo header left column. */
export function GameDeckResourceRows({
  resources,
  className = '',
  bordered = true,
}: {
  resources: GameDeckResource[];
  className?: string;
  bordered?: boolean;
}) {
  if (resources.length === 0) return null;
  return (
    <ul
      className={`space-y-0 ${
        bordered
          ? 'rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/70'
          : ''
      } ${className}`}
    >
      {resources.map((r) => {
        const clickable = typeof r.onClick === 'function';
        const Row = clickable ? 'button' : 'div';
        const Wrapper = r.tooltip ? Tooltip : null;
        const wrapperProps = r.tooltip ? ({ content: gameTooltipRich(r.label, r.tooltip) } as const) : null;
        const innerContent = (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 kx-body">
                {r.icon ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-400">
                    {r.icon}
                  </span>
                ) : null}
                <span className="truncate font-medium">{r.label}</span>
              </div>
              {r.description ? (
                <div className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">{r.description}</div>
              ) : null}
            </div>
            <div className="ml-auto flex min-w-0 flex-shrink-0 flex-col items-end text-right">
              <div
                className={`text-base font-black tabular-nums ${
                  typeof r.value === 'string' || typeof r.value === 'number' ? accentValueClass(r.accent) : ''
                }`}
              >
                {r.value}
              </div>
              {r.subValue ? (
                <div className="mt-0.5 text-[11px] leading-snug font-semibold text-zinc-500 dark:text-zinc-400">{r.subValue}</div>
              ) : null}
            </div>
          </>
        );

        const rowClassName = [
          'w-full flex items-center justify-between gap-3 py-2 px-3 text-left transition-colors',
          clickable ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg' : '',
        ].join(' ');

        return (
          <li key={r.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            {Wrapper ? (
              <Wrapper {...wrapperProps!}>
                <Row type={clickable ? 'button' : undefined} onClick={r.onClick} className={rowClassName}>
                  {innerContent}
                </Row>
              </Wrapper>
            ) : (
              <Row type={clickable ? 'button' : undefined} onClick={r.onClick} className={rowClassName}>
                {innerContent}
              </Row>
            )}
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

        <GameDeckResourceRows resources={resources} bordered={false} />

        {props.footer ? <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">{props.footer}</div> : null}
      </GamePanelCard>
    </>
  );
}
