import type { MiningSlot } from '@/lib/game/engine';

/**
 * HARD RULE: every Hub NFT slot (now and future) must sync into this registry.
 * The global lock map reads the registry first so new games do not need a merge switch edit.
 *
 * Call `syncGlobalNftSlotsForEntity` / `syncMiningSlotsToGlobalRegistry` on load and after
 * every slot assign / remove / persist.
 */

export const GLOBAL_NFT_SLOT_REGISTRY_PREFIX = 'kasparex:global-nft-slots:v1';
export const GLOBAL_NFT_SLOT_USAGE_EVENT = 'kasparex-nft-usage';

export type GlobalNftSlotRegistration = {
  ref: string;
  entityType: string;
  entityId: string;
  slotIndex: number;
  href: string;
  label: string;
  updatedAt: number;
};

type RegistryDoc = {
  version: 1;
  wallet: string;
  slots: GlobalNftSlotRegistration[];
};

type CrewLike = {
  nftRef?: string | null;
  collection?: string | null;
  tokenId?: number | null;
  nftId?: number | null;
  type?: string;
} | null;

function nftRefKey(collection: string, tokenId: number): string {
  return `${String(collection).trim().toUpperCase()}#${Number(tokenId)}`;
}

function normalizeNftRef(ref: string): string {
  const trimmed = (ref ?? '').trim();
  if (!trimmed.includes('#')) return trimmed.toUpperCase();
  const [collection, tokenStr] = trimmed.split('#');
  const tokenId = Number(tokenStr);
  if (!collection || !Number.isFinite(tokenId)) return trimmed;
  return nftRefKey(collection, tokenId);
}

function walletKey(wallet: string): string {
  return `${GLOBAL_NFT_SLOT_REGISTRY_PREFIX}:${wallet.trim().toLowerCase()}`;
}

function broadcastUsage(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GLOBAL_NFT_SLOT_USAGE_EVENT));
}

function readDoc(wallet: string): RegistryDoc {
  const empty: RegistryDoc = { version: 1, wallet: wallet.trim().toLowerCase(), slots: [] };
  if (typeof window === 'undefined' || !wallet.trim()) return empty;
  try {
    const raw = localStorage.getItem(walletKey(wallet));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<RegistryDoc>;
    if (!parsed || !Array.isArray(parsed.slots)) return empty;
    return {
      version: 1,
      wallet: empty.wallet,
      slots: parsed.slots.filter(
        (s): s is GlobalNftSlotRegistration =>
          Boolean(s && typeof s.ref === 'string' && s.ref.includes('#') && typeof s.entityType === 'string'),
      ),
    };
  } catch {
    return empty;
  }
}

function writeDoc(doc: RegistryDoc): void {
  if (typeof window === 'undefined' || !doc.wallet) return;
  try {
    localStorage.setItem(walletKey(doc.wallet), JSON.stringify(doc));
    broadcastUsage();
  } catch {
    // ignore quota
  }
}

export function readGlobalNftSlotRegistry(wallet: string | undefined): GlobalNftSlotRegistration[] {
  if (!wallet?.trim()) return [];
  return readDoc(wallet).slots;
}

function slotToRef(slot: CrewLike): string | null {
  if (!slot) return null;
  let ref = (slot.nftRef ?? '').trim();
  if (!ref && slot.collection != null && slot.tokenId != null) {
    ref = nftRefKey(String(slot.collection), Number(slot.tokenId));
  }
  if (!ref && slot.collection != null && slot.nftId != null) {
    ref = nftRefKey(String(slot.collection), Number(slot.nftId));
  }
  if (!ref.includes('#')) return null;
  return normalizeNftRef(ref);
}

/**
 * Replace all registry rows for one entity surface with the live slot list.
 * Empty / null slots are omitted (free).
 */
export function syncGlobalNftSlotsForEntity(args: {
  wallet: string | undefined;
  entityType: string;
  entityId: string;
  href: string;
  labelFor: (slotIndex: number, ref: string) => string;
  slots: CrewLike[];
}): void {
  const wallet = (args.wallet ?? '').trim();
  if (!wallet || typeof window === 'undefined') return;
  const now = Date.now();
  const nextRows: GlobalNftSlotRegistration[] = [];
  args.slots.forEach((slot, slotIndex) => {
    const ref = slotToRef(slot);
    if (!ref) return;
    nextRows.push({
      ref,
      entityType: args.entityType,
      entityId: args.entityId,
      slotIndex,
      href: args.href,
      label: args.labelFor(slotIndex, ref),
      updatedAt: now,
    });
  });

  const doc = readDoc(wallet);
  const kept = doc.slots.filter(
    (s) => !(s.entityType === args.entityType && s.entityId === args.entityId),
  );
  writeDoc({ ...doc, slots: [...kept, ...nextRows] });
}

export function syncMiningSlotsToGlobalRegistry(args: {
  wallet: string | undefined;
  entityType: string;
  entityId: string;
  href: string;
  slots: MiningSlot[];
  labelFor?: (slot: MiningSlot, slotIndex: number) => string;
}): void {
  const labelFor =
    args.labelFor ??
    ((slot: MiningSlot, idx: number) => `${args.entityType} (${slot.type}) #${idx + 1}`);
  syncGlobalNftSlotsForEntity({
    wallet: args.wallet,
    entityType: args.entityType,
    entityId: args.entityId,
    href: args.href,
    labelFor: (slotIndex) => {
      const slot = args.slots[slotIndex]!;
      return labelFor(slot, slotIndex);
    },
    slots: args.slots.map((s) =>
      s.nftId != null && s.collection
        ? { collection: s.collection, nftId: s.nftId, type: s.type }
        : null,
    ),
  });
}
