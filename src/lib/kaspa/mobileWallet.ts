import type { KaspaWalletProvider } from './types';
import { KASPA_WALLET_PROVIDERS } from './wallet';

export function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export const MOBILE_L1_WALLET_STORE: Partial<
  Record<KaspaWalletProvider, { android?: string; ios?: string; web: string }>
> = {
  kastle: {
    android: 'https://play.google.com/store/apps/details?id=cc.kastle',
    ios: 'https://apps.apple.com/app/kastle-crypto-wallet/id6745494363',
    web: 'https://kastle.cc/',
  },
  kasware: {
    android: 'https://docs.kasware.xyz/wallet/',
    web: 'https://docs.kasware.xyz/wallet/',
  },
  kaspium: {
    android: 'https://play.google.com/store/apps/details?id=com.kaspium.wallet',
    ios: 'https://apps.apple.com/app/kaspium-wallet/id6443778154',
    web: 'https://kaspium.app',
  },
  okx: {
    android: 'https://www.okx.com/download',
    ios: 'https://apps.apple.com/app/okx-buy-bitcoin-eth-crypto/id1327268470',
    web: 'https://www.okx.com/web3',
  },
};

/** Best store / install URL for the current mobile OS. */
export function getMobileWalletInstallUrl(provider: KaspaWalletProvider): string {
  const meta = MOBILE_L1_WALLET_STORE[provider];
  const fallback =
    KASPA_WALLET_PROVIDERS[provider]?.downloadUrl ??
    KASPA_WALLET_PROVIDERS[provider]?.documentationUrl ??
    'https://kaspa.org';

  if (!meta || typeof navigator === 'undefined') return fallback;
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && meta.ios) return meta.ios;
  if (/Android/i.test(navigator.userAgent) && meta.android) return meta.android;
  return meta.web;
}

/** Wallets that can inject a provider when the Hub is opened inside their in-app browser. */
export const MOBILE_DAPP_BROWSER_WALLETS: KaspaWalletProvider[] = ['kastle', 'kasware', 'okx'];

export function mobileWalletConnectHint(provider: KaspaWalletProvider): string {
  const name = KASPA_WALLET_PROVIDERS[provider]?.name ?? provider;
  if (provider === 'kastle') {
    return `Install ${name}, open Kasparex from the wallet's Explore / dApp browser, then tap Connect again. Kastle is the recommended mobile wallet for dApps.`;
  }
  if (provider === 'kasware') {
    return `KasWare on mobile works inside the KasWare app browser (Android). On iPhone, use Kastle for in-app dApp connections.`;
  }
  if (provider === 'okx') {
    return `Open Kasparex inside the OKX Wallet app's dApp browser, then connect from there.`;
  }
  return `Install ${name} and open this site from the wallet's built-in browser to connect.`;
}

/** Request KIP-12 wallets to announce themselves (mobile in-app browsers). */
export function requestKaspaProviders(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kaspa:requestProvider'));
}
