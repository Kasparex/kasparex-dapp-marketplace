import { Token } from '../tokens/types';

export interface DEXConfig {
  id: string;
  name: string;
  logo: string;
  website: string;
  type: 'iframe' | 'sdk';
  iframeUrl?: string; // Standard swap interface
  testnetIframeUrl?: string;
}

export const SUPPORTED_DEXS: DEXConfig[] = [
  {
    id: 'kaspacom',
    name: 'KaspaCom DEX',
    logo: '/img/logos/kaspacom.png', // Placeholder, should check if exists
    website: 'https://defi.kaspa.com',
    type: 'iframe',
    iframeUrl: 'https://defi.kaspa.com/swap',
    testnetIframeUrl: 'https://dev-defi.kaspa.com/swap',
  }
];

export function getDEXById(id: string): DEXConfig | undefined {
  return SUPPORTED_DEXS.find(dex => dex.id === id);
}

export function getSwapUrl(dexId: string, options?: {
  inputCurrency?: string;
  outputCurrency?: string;
  chain?: number;
  isTestnet?: boolean;
}): string {
  const dex = getDEXById(dexId);
  if (!dex || !dex.iframeUrl) return '';

  const baseUrl = options?.isTestnet ? (dex.testnetIframeUrl || dex.iframeUrl) : dex.iframeUrl;
  const url = new URL(baseUrl);

  if (options?.inputCurrency) url.searchParams.set('inputCurrency', options.inputCurrency);
  if (options?.outputCurrency) url.searchParams.set('outputCurrency', options.outputCurrency);
  if (options?.chain) url.searchParams.set('chain', options.chain.toString());

  return url.toString();
}
