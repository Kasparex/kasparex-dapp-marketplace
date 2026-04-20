export const KASPAREX_L1_PAYMENT_NOTE_PREFIX = 'KASPAREX_PAY_V1:';

export function buildKasparexL1PaymentNote(input: {
  gameId?: string;
  skuId?: string;
  sessionId?: string;
  evmAddress?: string;
}): string {
  const gameId = (input.gameId ?? '').trim();
  const skuId = (input.skuId ?? '').trim();
  const sessionId = (input.sessionId ?? '').trim();
  const evm = (input.evmAddress ?? '').trim().toLowerCase();
  return `${KASPAREX_L1_PAYMENT_NOTE_PREFIX}${gameId}|${skuId}|${sessionId}|${evm}`;
}

