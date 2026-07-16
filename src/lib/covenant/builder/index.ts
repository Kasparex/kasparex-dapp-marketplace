/**
 * Extensible unsigned covenant tx builder (KasCoven / KIP-12 / KaspaCom aligned).
 *
 * Hub builds Safe-JSON; wallet signs via signPskt; wallet pushTx broadcasts.
 * Template-specific logic plugs into the registry; shared WASM + UTXO helpers stay here.
 */

export type { UnsignedCovenantTx, BuildDeployInput, BuildSpendInput, CovenantBuilderContext } from './types';
export { isKaspaWasmAvailable, loadKaspaWasm } from './kaspa-wasm';
export { buildUnsignedCovenantDeploy, buildUnsignedCovenantSpend } from './registry';
export { getCovenantP2shAddress } from './address';
