/**
 * KaspaCom indexer deploy payload claims (network-keyed JSON on tx.payload).
 * @see https://github.com/KASPACOM/indexer-decoder-requests/blob/main/docs/covenant-indexer-best-practices.md
 */

import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import { kpxCovenantPayloadMeta } from '@/lib/covenant/kpxBranding';
import type { KaspaComPayloadArg } from './types';

export { KPX_COVENANT_PAYLOAD_TEMPLATES } from '@/lib/covenant/kpxBranding';

const PAYLOAD_NETWORK_KEY: Record<ProgrammableNetworkId, string> = {
  'testnet-10': 'tn10',
  mainnet: 'mainnet',
};

export function buildDeployPayloadEnvelope(input: {
  networkId: ProgrammableNetworkId;
  template: string;
  args?: KaspaComPayloadArg[];
  meta?: Record<string, string>;
}): Record<string, unknown> {
  const networkKey = PAYLOAD_NETWORK_KEY[input.networkId];
  return {
    [networkKey]: {
      v: 1,
      tmpl: input.template,
      args: input.args ?? [],
      meta: kpxCovenantPayloadMeta(input.meta),
    },
  };
}

/** UTF-8 JSON payload as lowercase hex (for wallet transactionPayloadHex). */
export function buildDeployPayloadHex(input: {
  networkId: ProgrammableNetworkId;
  template: string;
  args?: KaspaComPayloadArg[];
  meta?: Record<string, string>;
}): string {
  const json = JSON.stringify(buildDeployPayloadEnvelope(input));
  const bytes = new TextEncoder().encode(json);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
