import { utf8ToHex } from '@/lib/vblog/payloadHex';

export const KCAP_PAYLOAD_PREFIX = 'kcap1:';

export function buildCapsuleCommitPlainNote(args: {
  messageId: string;
  chunkTotal: number;
  rootHash: string;
  contentHash: string;
}): string {
  return `${KCAP_PAYLOAD_PREFIX}commit:${args.messageId}:leave-message:${args.chunkTotal}:${args.rootHash}:${args.contentHash}:1`;
}

export function buildCapsuleCommitPayloadHex(args: Parameters<typeof buildCapsuleCommitPlainNote>[0]): string {
  return utf8ToHex(buildCapsuleCommitPlainNote(args));
}
