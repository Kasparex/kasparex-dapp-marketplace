import { CHRONICLES_LB_PAYLOAD_PREFIX, type ChroniclesLbEntityType } from './constants';

function utf8ToHex(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeToken(token: string): string {
  // Payload uses ':' as delimiter; avoid unparseable values.
  return token.replace(/:/g, '_').trim();
}

export function buildChroniclesLbActivateSlotText(args: {
  entityType: ChroniclesLbEntityType;
  entityId: string;
  slotIndex: 2 | 3;
  payerKaspa: string;
}): string {
  return `${CHRONICLES_LB_PAYLOAD_PREFIX}slot:activate:${sanitizeToken(args.entityType)}:${sanitizeToken(args.entityId)}:${args.slotIndex}:${args.payerKaspa.trim()}`;
}

export function buildChroniclesLbSetSlotText(args: {
  entityType: ChroniclesLbEntityType;
  entityId: string;
  slotIndex: 1 | 2 | 3;
  nftRef: string;
  payerKaspa: string;
}): string {
  return `${CHRONICLES_LB_PAYLOAD_PREFIX}slot:set:${sanitizeToken(args.entityType)}:${sanitizeToken(args.entityId)}:${args.slotIndex}:${sanitizeToken(args.nftRef)}:${args.payerKaspa.trim()}`;
}

export function buildChroniclesLbClearSlotText(args: {
  entityType: ChroniclesLbEntityType;
  entityId: string;
  slotIndex: 1 | 2 | 3;
  payerKaspa: string;
}): string {
  return `${CHRONICLES_LB_PAYLOAD_PREFIX}slot:clear:${sanitizeToken(args.entityType)}:${sanitizeToken(args.entityId)}:${args.slotIndex}:${args.payerKaspa.trim()}`;
}

export function buildChroniclesLbReadConfirmText(args: {
  entityType: ChroniclesLbEntityType;
  entityId: string;
  payerKaspa: string;
}): string {
  return `${CHRONICLES_LB_PAYLOAD_PREFIX}read:${sanitizeToken(args.entityType)}:${sanitizeToken(args.entityId)}:${args.payerKaspa.trim()}`;
}

export function chroniclesLbPayloadHexFromText(text: string): string {
  return utf8ToHex(text);
}

