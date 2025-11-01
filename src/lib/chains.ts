import { defineChain } from 'thirdweb/chains';

/**
 * Kasplex Chain Configuration (Layer 2 on Kaspa)
 * 
 * Network Details:
 * - RPC: https://evmrpc.kasplex.org
 * - Explorer: https://explorer.kasplex.org
 * - Chain ID: 202555
 * - Token: KAS
 */
export const kasplexChain = defineChain({
  id: 202555,
  name: 'Kasplex',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'KAS',
    decimals: 18,
  },
  rpc: ['https://evmrpc.kasplex.org'], // RPC must be an array
  blockExplorers: [
    {
      name: 'Kasplex Explorer',
      url: 'https://explorer.kasplex.org',
    },
  ],
  testnet: false,
});

