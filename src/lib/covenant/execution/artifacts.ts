import { loadCovenantArtifact } from '@/lib/programmability/artifacts';
import type { CovenantTemplate } from '@/lib/programmability/types';
import type { KaspaComCompiledContract } from './types';

function hexToScriptBytes(scriptHex: string): number[] {
  const normalized = scriptHex.trim().replace(/^0x/i, '');
  const out: number[] = [];
  for (let i = 0; i < normalized.length; i += 2) {
    out.push(Number.parseInt(normalized.slice(i, i + 2), 16));
  }
  return out;
}

/** Load KaspaCom-shaped compiled contract from Hub static artifacts. */
export async function loadKaspaComCompiledContract(
  template: CovenantTemplate,
): Promise<KaspaComCompiledContract | null> {
  const meta = await loadCovenantArtifact(template);
  const embedded = (meta as { compiled?: KaspaComCompiledContract }).compiled;
  if (embedded?.script?.length && embedded.abi?.length) {
    return embedded;
  }
  if (!meta.scriptHex) return null;
  return {
    contract_name: meta.contract,
    script: hexToScriptBytes(meta.scriptHex),
    abi: (meta as { abi?: KaspaComCompiledContract['abi'] }).abi ?? [],
    without_selector: true,
  };
}

export function resolveSpendFunctionName(
  compiled: KaspaComCompiledContract | null,
  fallback = 'claim',
): string {
  if (!compiled?.abi?.length) return fallback;
  const entrypoint = compiled.abi.find((e) => e.name.includes('entrypoint') || e.name === fallback);
  if (entrypoint) return entrypoint.name;
  const nonCtor = compiled.abi.find((e) => !e.name.startsWith('__covenant_constructor'));
  return nonCtor?.name ?? compiled.abi[0].name;
}
