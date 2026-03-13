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
  type?: 'swap' | 'create-liquidity';
  theme?: string;
}): string {
  const dex = getDEXById(dexId);
  if (!dex || !dex.iframeUrl) return '';

  const baseUrl = options?.isTestnet ? (dex.testnetIframeUrl || dex.iframeUrl) : dex.iframeUrl;
  
  // Handle different paths
  let finalUrl = baseUrl;
  if (options?.type === 'create-liquidity') {
    finalUrl = finalUrl.replace(/\/swap$/, '/swap/create-liquidity');
  }
  
  const url = new URL(finalUrl);

  if (options?.type === 'create-liquidity') {
    if (options.inputCurrency) url.searchParams.set('tokenA', options.inputCurrency);
    if (options.outputCurrency) url.searchParams.set('tokenB', options.outputCurrency);
  } else {
    if (options?.inputCurrency) url.searchParams.set('inputCurrency', options.inputCurrency);
    if (options?.outputCurrency) url.searchParams.set('outputCurrency', options.outputCurrency);
  }
  
  if (options?.chain) url.searchParams.set('chain', options.chain.toString());
  if (options?.theme) url.searchParams.set('theme', options.theme);
  
  // Attempt to hide sidebar/header via common params
  url.searchParams.set('embed', 'true');
  url.searchParams.set('hideSidebar', 'true');

  return url.toString();
}
