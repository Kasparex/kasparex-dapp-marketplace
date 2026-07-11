import type { DApp } from '@/lib/dapps';
import type { Token } from '@/lib/tokens/types';
import type { VBlogArticle } from '@/lib/vblog/types';
import type { Magazine } from '@/lib/magazines/types';
import type { UnifiedGame } from '@/lib/games/registry';
import { normalizeStorePaymentCurrency } from '@/lib/store/currencies';

export function sortCurrencyLabels(values: Iterable<string>): string[] {
  return Array.from(new Set([...values].map((v) => v.trim()).filter((v) => v.length > 0))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getDAppListingCurrencies(dapps: DApp[]): string[] {
  const currencies = new Set<string>();
  dapps.forEach((dapp) => {
    const listed = dapp.directoryListing?.paymentCurrency;
    currencies.add(listed ? normalizeStorePaymentCurrency(listed) : 'KAS');
  });
  return sortCurrencyLabels(currencies);
}

export function dAppMatchesCurrencies(dapp: DApp, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const listed = dapp.directoryListing?.paymentCurrency;
  const currency = listed ? normalizeStorePaymentCurrency(listed) : 'KAS';
  return selected.includes(currency);
}

export function getTokenListingCurrencies(tokens: Token[]): string[] {
  return sortCurrencyLabels(tokens.map((t) => t.symbol));
}

export function tokenMatchesCurrencies(token: Token, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.includes(token.symbol);
}

export function getGameListingCurrencies(games: UnifiedGame[]): string[] {
  const currencies = new Set<string>();
  games.forEach((game) => {
    game.skus?.forEach((sku) => currencies.add(sku.currency));
    currencies.add('KAS');
  });
  return sortCurrencyLabels(currencies);
}

export function gameMatchesCurrencies(game: UnifiedGame, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const gameCurrencies = new Set<string>(['KAS']);
  game.skus?.forEach((sku) => gameCurrencies.add(sku.currency));
  return selected.some((c) => gameCurrencies.has(c));
}

export function getVBlogArticleCurrencies(articles: VBlogArticle[]): string[] {
  const currencies = new Set<string>(['KAS', 'KREX']);
  articles.forEach((article) => {
    const tipCurrencies = article.modules?.tipBox?.currencies;
    if (tipCurrencies?.length) {
      tipCurrencies.forEach((c) => currencies.add(c));
    }
  });
  return sortCurrencyLabels(currencies);
}

export function vblogArticleMatchesCurrencies(article: VBlogArticle, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const tipCurrencies = article.modules?.tipBox?.currencies;
  const accepted = tipCurrencies?.length ? tipCurrencies : ['KAS'];
  return selected.some((c) => accepted.includes(c));
}

export function getMagazineListingCurrencies(_magazines: Magazine[]): string[] {
  return ['KAS', 'KREX'];
}

export function magazineMatchesCurrencies(_magazine: Magazine, _selected: string[]): boolean {
  return true;
}

export const CROWDKAS_LISTING_CURRENCIES = ['KAS', 'iKAS', 'KREX'] as const;
