/**
 * Token Trading Section
 * Shows trading options for tokens (especially when fully minted or for L1/L2 tokens like KREX)
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from './TokenLogo';

interface TokenTradingSectionProps {
  token: Token;
}

const L2_DEXS = [
  {
    name: 'Zealous Swap',
    url: 'https://app.zealousswap.com/swap',
    description: 'Swap tokens on Zealous Swap',
  },
  {
    name: 'KaspaCom',
    url: 'https://defi.kaspa.com/swap',
    description: 'Decentralized exchange on KaspaCom',
  },
  {
    name: 'KSPR',
    url: 'https://app.kspr.exchange/trade',
    description: 'Trade on KSPR Exchange',
  },
  {
    name: 'KaspaFinance',
    url: 'https://app.kaspafinance.io/swap',
    description: 'Swap tokens on KaspaFinance',
  },
];

const L1_EXCHANGES = [
  {
    name: 'AscendEX',
    url: 'https://www.ascendex.com/en/cashtrade-spottrading/usdt/krex',
    description: 'Buy KREX/USDT on AscendEX',
  },
  {
    name: 'CoinEx',
    url: 'https://www.coinex.com/en/exchange/krex-usdt',
    description: 'Buy KREX/USDT on CoinEx',
  },
  {
    name: 'KSPR Bot',
    url: 'https://t.me/kspr_home_bot?start=AXFM1TM',
    description: 'Buy KREX via Telegram bot',
  },
  {
    name: 'KaspaCom',
    url: 'https://www.kaspa.com/?ref=01boeP91',
    description: 'Buy KREX on KaspaCom',
  },
  {
    name: 'XT.com',
    url: 'https://www.xt.com/en/trade/krex_usdt',
    description: 'Buy KREX/USDT on XT.com',
  },
];

export function TokenTradingSection({ token }: TokenTradingSectionProps) {
  // KREX is available on both L1 and L2
  const isKREX = token.id === 'krex' || token.symbol.toUpperCase() === 'KREX';
  const hasL1AndL2 = isKREX || (token.l1Address && token.l2Address);

  return (
    <section id="trading" className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Trade</h2>
        <TokenLogo token={token} size={32} showSymbol={true} showName={false} />
      </div>

      {/* L2 Trading Options */}
      {(token.network === 'L2' || hasL1AndL2) && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            L2 (Kasplex) Trading
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Trade {token.symbol} on L2 decentralized exchanges:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {L2_DEXS.map((exchange, index) => (
              <a
                key={index}
                href={exchange.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#02abb8] hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {exchange.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {exchange.description}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-zinc-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* L1 Trading Options */}
      {(token.network === 'L1' || hasL1AndL2) && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            L1 (Kaspa) Trading
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Trade {token.symbol} on L1 centralized exchanges:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {L1_EXCHANGES.map((exchange, index) => (
              <a
                key={index}
                href={exchange.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#02abb8] hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {exchange.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {exchange.description}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-zinc-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bridge Information */}
      {hasL1AndL2 && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
            {token.symbol} is available on both L1 and L2. Bridge tokens between networks:
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://katbridge.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#02abb8] hover:text-[#028a94] underline"
            >
              Bridge via KAT Bridge →
            </a>
            <a
              href="https://kasbridge-evm.kaspafoundation.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#02abb8] hover:text-[#028a94] underline"
            >
              Bridge via KasBridge →
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
