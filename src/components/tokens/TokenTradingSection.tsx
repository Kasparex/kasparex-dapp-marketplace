/**
 * Token Trading Section
 * Locked Hub metadata boxes + accent hover.
 */

'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { KX_PANEL, KX_SURFACE_NESTED, metadataStatGridClassForCount } from '@/lib/hub/shellTokens';

interface TokenTradingSectionProps {
  token: Token;
}

const L2_DEXS = [
  {
    name: 'Zealous Swap',
    url: 'https://app.zealousswap.com/swap',
    description: 'Swap on Zealous',
  },
  {
    name: 'Kasparex Swap',
    url: '/defi/swaps',
    description: 'Kasparex DeFi Hub',
    isInternal: true,
  },
  {
    name: 'KaspaCom',
    url: 'https://defi.kaspa.com/swap',
    description: 'KaspaCom DEX',
  },
  {
    name: 'KSPR',
    url: 'https://app.kspr.exchange/trade',
    description: 'KSPR Exchange',
  },
];

const L1_EXCHANGES = [
  {
    name: 'CoinEx',
    url: 'https://www.coinex.com/en/exchange/krex-usdt',
    description: 'KREX/USDT',
  },
  {
    name: 'KSPR Bot',
    url: 'https://t.me/kspr_home_bot?start=AXFM1TM',
    description: 'Telegram bot',
  },
  {
    name: 'KaspaCom',
    url: 'https://www.kaspa.com/?ref=01boeP91',
    description: 'KaspaCom',
  },
  {
    name: 'XT.com',
    url: 'https://www.xt.com/en/trade/krex_usdt',
    description: 'KREX/USDT',
  },
];

function ExchangeCard(props: {
  name: string;
  description: string;
  href: string;
  internal?: boolean;
  official?: boolean;
}) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {props.name}
          {props.official ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)]">
              Official
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{props.description}</div>
      </div>
      <svg
        className="h-4 w-4 shrink-0 text-[color:var(--hub-accent)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </>
  );

  const className = `${KX_SURFACE_NESTED} flex !flex-row items-center justify-between gap-3 p-3 text-left font-sans transition-colors hover:border-[color:var(--hub-accent)]`;

  if (props.internal) {
    return (
      <Link href={props.href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}

export function TokenTradingSection({ token }: TokenTradingSectionProps) {
  const isKREX = token.id === 'krex' || token.symbol.toUpperCase() === 'KREX';
  const hasL1AndL2 = isKREX || (token.l1Address && token.l2Address);

  return (
    <section id="trading" className="space-y-6">
      <GameOverviewTitleBlock
        kicker="Trade"
        title="Swap"
        subtitle={`Trade ${token.symbol} on supported venues.`}
        as="h2"
      />

      {(token.network === 'L2' || hasL1AndL2) && (
        <div className={`${KX_PANEL} space-y-4 p-5 sm:p-6`}>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">L2 (Kasplex) Trading</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Trade {token.symbol} on L2 decentralized exchanges.
          </p>
          <div className={metadataStatGridClassForCount(L2_DEXS.length)}>
            {L2_DEXS.map((exchange) => (
              <ExchangeCard
                key={exchange.name}
                name={exchange.name}
                description={exchange.description}
                href={exchange.url}
                internal={Boolean(exchange.isInternal)}
                official={Boolean(exchange.isInternal)}
              />
            ))}
          </div>
        </div>
      )}

      {(token.network === 'L1' || hasL1AndL2) && (
        <div className={`${KX_PANEL} space-y-4 p-5 sm:p-6`}>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">L1 (Kaspa) Trading</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Trade {token.symbol} on L1 venues.
          </p>
          <div className={metadataStatGridClassForCount(L1_EXCHANGES.length)}>
            {L1_EXCHANGES.map((exchange) => (
              <ExchangeCard
                key={exchange.name}
                name={exchange.name}
                description={exchange.description}
                href={exchange.url}
              />
            ))}
          </div>
        </div>
      )}

      {hasL1AndL2 ? (
        <div className={`${KX_SURFACE_NESTED} p-4 text-left`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Bridge
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {token.symbol} is on L1 and L2. Bridge between networks:
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="https://katbridge.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[color:var(--hub-accent)] hover:underline"
            >
              KAT Bridge
            </a>
            <a
              href="https://kasbridge-evm.kaspafoundation.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[color:var(--hub-accent)] hover:underline"
            >
              KasBridge
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
