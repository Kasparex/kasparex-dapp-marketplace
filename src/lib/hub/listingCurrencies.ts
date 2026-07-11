import type { DApp } from '@/lib/dapps';
import type { Token } from '@/lib/tokens/types';
import { tokenIsVerified } from '@/lib/tokens/listing';
import type { VBlogArticle } from '@/lib/vblog/types';
import type { Magazine } from '@/lib/magazines/types';
import type { UnifiedGame } from '@/lib/games/registry';
import { normalizeStorePaymentCurrency } from '@/lib/store/currencies';
import { filterToVerifiedHubCrypto, isVerifiedHubCrypto } from '@/lib/hub/verifiedCurrencies';

export function sortCurrencyLabels(values: Iterable<string>): string[] {
  return filterToVerifiedHubCrypto(values);
}

export function getDAppListingCurrencies(dapps: DApp[]): string[] {
  const currencies: string[] = [];
  dapps.forEach((dapp) => {
    const listed = dapp.directoryListing?.paymentCurrency;
    const currency = listed ? normalizeStorePaymentCurrency(listed) : 'KAS';
    if (isVerifiedHubCrypto(currency)) currencies.push(currency);
  });
  if (currencies.length === 0) return ['KAS'];
  return sortCurrencyLabels(currencies);
}

export function dAppMatchesCurrencies(dapp: DApp, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const listed = dapp.directoryListing?.paymentCurrency;
  const currency = listed ? normalizeStorePaymentCurrency(listed) : 'KAS';
  return selected.includes(currency);
}

export function getTokenListingCurrencies(tokens: Token[]): string[] {
  return sortCurrencyLabels(tokens.filter(tokenIsVerified).map((t) => t.symbol));
}

export function tokenMatchesCurrencies(token: Token, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.includes(token.symbol.toUpperCase());
}

export function getGameListingCurrencies(games: UnifiedGame[]): string[] {
  const currencies: string[] = [];
  games.forEach((game) => {
    game.skus?.forEach((sku) => {
      if (isVerifiedHubCrypto(sku.currency)) currencies.push(sku.currency);
    });
  });
  currencies.push('KAS');
  return sortCurrencyLabels(currencies);
}

export function gameMatchesCurrencies(game: UnifiedGame, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const gameCurrencies = new Set<string>(['KAS']);
  game.skus?.forEach((sku) => {
    if (isVerifiedHubCrypto(sku.currency)) gameCurrencies.add(sku.currency);
  });
  return selected.some((c) => gameCurrencies.has(c));
}

export function getVBlogArticleCurrencies(articles: VBlogArticle[]): string[] {
  const currencies: string[] = ['KAS', 'KREX'];
  articles.forEach((article) => {
    const tipCurrencies = article.modules?.tipBox?.currencies;
    if (tipCurrencies?.length) {
      tipCurrencies.forEach((c) => {
        if (isVerifiedHubCrypto(c)) currencies.push(c);
      });
    }
  });
  return sortCurrencyLabels(currencies);
}

export function vblogArticleMatchesCurrencies(article: VBlogArticle, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const tipCurrencies = article.modules?.tipBox?.currencies?.filter(isVerifiedHubCrypto);
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
