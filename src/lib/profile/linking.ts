import { verifyMessage } from 'viem';

export type LinkEvmMessageParams = {
  kaspaAddress: string;
  evmAddress: `0x${string}`;
  nonce: string;
  issuedAtIso: string;
  host: string;
};

export function buildLinkEvmMessage(p: LinkEvmMessageParams): string {
  // Keep this stable: it becomes the canonical proof format.
  return [
    `Kasparex Hub - Link Wallets`,
    ``,
    `I am linking an EVM wallet to my Kaspa identity for Kasparex Hub.`,
    ``,
    `Kaspa: ${p.kaspaAddress}`,
    `EVM: ${p.evmAddress}`,
    `Host: ${p.host}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAtIso}`,
  ].join('\n');
}

export async function verifyLinkEvmSignature(args: {
  message: string;
  evmAddress: `0x${string}`;
  signature: `0x${string}`;
}): Promise<boolean> {
  try {
    return await verifyMessage({
      address: args.evmAddress,
      message: args.message,
      signature: args.signature,
    });
  } catch {
    return false;
  }
}

