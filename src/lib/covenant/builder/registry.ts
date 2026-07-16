import type { CovenantTemplate } from '@/lib/programmability/types';
import type { BuildDeployInput, BuildSpendInput, UnsignedCovenantTx } from './types';
import { buildGenericUnsignedDeploy } from './deploy';
import { buildGenericUnsignedSpend } from './spend';

/**
 * Template registry: today every template uses the shared P2SH genesis deploy builder.
 * Add specialized builders here later (stateful constructors, multi-output crowdfund, etc.).
 */
const DEPLOY_BUILDERS: Partial<
  Record<CovenantTemplate, (input: BuildDeployInput) => Promise<UnsignedCovenantTx>>
> = {
  lockbox: buildGenericUnsignedDeploy,
  split: buildGenericUnsignedDeploy,
  milestone: buildGenericUnsignedDeploy,
  crowdfund: buildGenericUnsignedDeploy,
  voucher: buildGenericUnsignedDeploy,
};

const SPEND_BUILDERS: Partial<
  Record<CovenantTemplate, (input: BuildSpendInput) => Promise<UnsignedCovenantTx>>
> = {
  lockbox: buildGenericUnsignedSpend,
  split: buildGenericUnsignedSpend,
  milestone: buildGenericUnsignedSpend,
  crowdfund: buildGenericUnsignedSpend,
  voucher: buildGenericUnsignedSpend,
};

export async function buildUnsignedCovenantDeploy(
  input: BuildDeployInput,
): Promise<UnsignedCovenantTx> {
  const builder = DEPLOY_BUILDERS[input.template] ?? buildGenericUnsignedDeploy;
  return builder(input);
}

export async function buildUnsignedCovenantSpend(
  input: BuildSpendInput,
): Promise<UnsignedCovenantTx> {
  const builder = SPEND_BUILDERS[input.template] ?? buildGenericUnsignedSpend;
  return builder(input);
}
