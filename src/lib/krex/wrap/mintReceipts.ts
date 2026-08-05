import type { Krc20BridgeNetwork } from './types';

export type KrexWrapMintReceipt = {
  depositTxHash: string;
  mintTxHash: string;
  amountRaw: string;
  amount: number;
  from?: string;
  recipientAddress?: string;
  recipientPubkey?: string;
  assetCovenantId?: string;
  mintedAt: string;
  status: 'minted';
};

export type KrexWrapMintReceiptStore = {
  network: Krc20BridgeNetwork;
  tick: string;
  updatedAt: string;
  ignoredDepositTxHashes: string[];
  receipts: KrexWrapMintReceipt[];
};

export const MINT_RECEIPTS_TN10_PATH = 'data/krex-wrap/mint-receipts-tn10.json';

export function emptyMintReceiptStore(
  network: Krc20BridgeNetwork = 'testnet-10',
  tick = 'TKREX',
): KrexWrapMintReceiptStore {
  return {
    network,
    tick,
    updatedAt: new Date().toISOString(),
    ignoredDepositTxHashes: [],
    receipts: [],
  };
}

export function normalizeTxHash(raw: string | undefined | null): string | null {
  const h = (raw || '').trim().toLowerCase().replace(/^0x/, '');
  return /^[a-f0-9]{64}$/.test(h) ? h : null;
}

export function normalizeMintReceiptStore(raw: unknown): KrexWrapMintReceiptStore {
  const empty = emptyMintReceiptStore();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const obj = raw as Record<string, unknown>;
  const receiptsIn = Array.isArray(obj.receipts) ? obj.receipts : [];
  const ignoredIn = Array.isArray(obj.ignoredDepositTxHashes) ? obj.ignoredDepositTxHashes : [];
  const receipts: KrexWrapMintReceipt[] = [];
  for (const row of receiptsIn) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const depositTxHash = normalizeTxHash(typeof r.depositTxHash === 'string' ? r.depositTxHash : '');
    const mintTxHash = normalizeTxHash(typeof r.mintTxHash === 'string' ? r.mintTxHash : '');
    if (!depositTxHash || !mintTxHash) continue;
    const amountRaw = typeof r.amountRaw === 'string' ? r.amountRaw : String(r.amountRaw ?? '');
    const amount =
      typeof r.amount === 'number' && Number.isFinite(r.amount)
        ? r.amount
        : Number(amountRaw) / 1e8;
    receipts.push({
      depositTxHash,
      mintTxHash,
      amountRaw,
      amount: Number.isFinite(amount) ? amount : 0,
      from: typeof r.from === 'string' ? r.from : undefined,
      recipientAddress: typeof r.recipientAddress === 'string' ? r.recipientAddress : undefined,
      recipientPubkey: typeof r.recipientPubkey === 'string' ? r.recipientPubkey : undefined,
      assetCovenantId: typeof r.assetCovenantId === 'string' ? r.assetCovenantId : undefined,
      mintedAt: typeof r.mintedAt === 'string' ? r.mintedAt : new Date().toISOString(),
      status: 'minted',
    });
  }
  return {
    network: obj.network === 'mainnet' ? 'mainnet' : 'testnet-10',
    tick: typeof obj.tick === 'string' && obj.tick.trim() ? obj.tick.trim().toUpperCase() : 'TKREX',
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
    ignoredDepositTxHashes: ignoredIn
      .map((x) => normalizeTxHash(typeof x === 'string' ? x : ''))
      .filter((x): x is string => Boolean(x)),
    receipts,
  };
}

export function findMintReceipt(
  store: KrexWrapMintReceiptStore,
  depositTxHash: string,
): KrexWrapMintReceipt | null {
  const key = normalizeTxHash(depositTxHash);
  if (!key) return null;
  return store.receipts.find((r) => r.depositTxHash === key) || null;
}

export function upsertMintReceipt(
  store: KrexWrapMintReceiptStore,
  receipt: KrexWrapMintReceipt,
): KrexWrapMintReceiptStore {
  const depositTxHash = normalizeTxHash(receipt.depositTxHash);
  const mintTxHash = normalizeTxHash(receipt.mintTxHash);
  if (!depositTxHash || !mintTxHash) {
    throw new Error('depositTxHash and mintTxHash must be 64-char hex');
  }
  const next: KrexWrapMintReceipt = {
    ...receipt,
    depositTxHash,
    mintTxHash,
    status: 'minted',
    mintedAt: receipt.mintedAt || new Date().toISOString(),
  };
  const others = store.receipts.filter((r) => r.depositTxHash !== depositTxHash);
  return {
    ...store,
    updatedAt: new Date().toISOString(),
    receipts: [next, ...others],
  };
}
