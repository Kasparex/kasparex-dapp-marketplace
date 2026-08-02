import type { MiningSlot } from '@/lib/game/engine';
import { CIPHER_VAULTS_STORAGE_PREFIX } from '@/lib/game/cipher-vaults-config';
import { diamondVeinsStorageKey } from '@/lib/game/diamond-veins-hub';
import { MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import { PRECISION_CLICK_STORAGE_PREFIX } from '@/lib/game/precision-click/config';

/**
 * HARD RULE (Hub-wide, non-negotiable):
 * One NFT may occupy at most one crew / operative / warden slot across all Kasparex games.
 * Once slotted anywhere, it is locked everywhere else until removed from that slot.
 */

export type GlobalNftUsageRow = {
  entityType: string;
  entityId: string;
  slotIndex: number;
  href: string;
  label: string;
};

export type GlobalNftSlotContext = {
  entityType: string;
  entityId: string;
  slotIndex: number;
};

/** Crew-style slots that store nftRef and/or collection+tokenId (Precision, Cipher). */
export type CrewNftUsageSlot = {
  nftRef?: string | null;
  collection?: string | null;
  tokenId?: number | null;
} | null;

/** @deprecated Alias for CrewNftUsageSlot. */
export type PrecisionOperativeUsageSlot = CrewNftUsageSlot;

export function nftRefKey(collection: string, tokenId: number): string {
  return `${String(collection).trim().toUpperCase()}#${Number(tokenId)}`;
}

export function normalizeNftRef(ref: string): string {
  const trimmed = (ref ?? '').trim();
  if (!trimmed.includes('#')) return trimmed.toUpperCase();
  const [collection, tokenStr] = trimmed.split('#');
  const tokenId = Number(tokenStr);
  if (!collection || !Number.isFinite(tokenId)) return trimmed;
  return nftRefKey(collection, tokenId);
}

function matchesContext(row: GlobalNftUsageRow, ctx: GlobalNftSlotContext): boolean {
  return (
    row.entityType === ctx.entityType &&
    row.entityId === ctx.entityId &&
    row.slotIndex === ctx.slotIndex
  );
}

export function findGlobalNftConflict(
  ref: string,
  usageByRef: Record<string, GlobalNftUsageRow[]>,
  exclude?: GlobalNftSlotContext | null,
): GlobalNftUsageRow | null {
  const key = normalizeNftRef(ref);
  const rows = usageByRef[key] ?? [];
  for (const row of rows) {
    if (exclude && matchesContext(row, exclude)) continue;
    return row;
  }
  return null;
}

function usageFromCrewSlot(
  slot: CrewNftUsageSlot,
  slotIndex: number,
  meta: { entityType: string; entityId: string; href: string; label: string },
): { ref: string; row: GlobalNftUsageRow } | null {
  if (!slot) return null;
  let ref = (slot.nftRef ?? '').trim();
  if (!ref && slot.collection != null && slot.tokenId != null) {
    ref = nftRefKey(String(slot.collection), Number(slot.tokenId));
  }
  if (!ref.includes('#')) return null;
  return {
    ref: normalizeNftRef(ref),
    row: {
      entityType: meta.entityType,
      entityId: meta.entityId,
      slotIndex,
      href: meta.href,
      label: meta.label,
    },
  };
}

function readJsonFromKeys(keys: string[]): unknown | null {
  if (typeof window === 'undefined') return null;
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw);
    } catch {
      // try next key
    }
  }
  return null;
}

function addressStorageKeys(prefix: string, payerKaspa: string): string[] {
  const trimmed = payerKaspa.trim();
  const lower = trimmed.toLowerCase();
  return Array.from(new Set([`${prefix}:${trimmed}`, `${prefix}:${lower}`]));
}

/** Read Sync Operative slots from Precision Click localStorage. */
export function readPrecisionOperativesFromStorage(payerKaspa: string | undefined): CrewNftUsageSlot[] {
  if (!payerKaspa?.trim()) return [];
  try {
    const parsed = readJsonFromKeys(addressStorageKeys(PRECISION_CLICK_STORAGE_PREFIX, payerKaspa)) as {
      operativeSlots?: CrewNftUsageSlot[];
      operative?: CrewNftUsageSlot;
    } | null;
    if (!parsed) return [];
    if (Array.isArray(parsed.operativeSlots) && parsed.operativeSlots.length > 0) {
      return parsed.operativeSlots;
    }
    if (parsed.operative) return [parsed.operative];
    return [];
  } catch {
    return [];
  }
}

/** Read Cipher Warden slots from Cipher Vaults localStorage. */
export function readCipherWardensFromStorage(payerKaspa: string | undefined): CrewNftUsageSlot[] {
  if (!payerKaspa?.trim()) return [];
  try {
    const parsed = readJsonFromKeys(addressStorageKeys(CIPHER_VAULTS_STORAGE_PREFIX, payerKaspa)) as {
      wardenSlots?: CrewNftUsageSlot[];
    } | null;
    if (!parsed) return [];
    return Array.isArray(parsed.wardenSlots) ? parsed.wardenSlots : [];
  } catch {
    return [];
  }
}

/** @deprecated Prefer readPrecisionOperativesFromStorage. */
export function readPrecisionOperativeFromStorage(payerKaspa: string | undefined): CrewNftUsageSlot {
  return readPrecisionOperativesFromStorage(payerKaspa)[0] ?? null;
}

export function readMinecoreNftSlotsFromMergedStorage(payerKaspa: string | undefined): MiningSlot[] {
  if (typeof window === 'undefined' || !payerKaspa?.trim()) return [];
  try {
    const parsed = readJsonFromKeys(addressStorageKeys(MINECORE_STORAGE_PREFIX, payerKaspa));
    if (!parsed || typeof parsed !== 'object') return [];
    const slots = (parsed as { nftSlots?: MiningSlot[] }).nftSlots;
    return Array.isArray(slots) ? slots : [];
  } catch {
    return [];
  }
}

export function readTyconSlotsFromMergedStorage(payerKaspa: string | undefined): MiningSlot[] {
  if (typeof window === 'undefined' || !payerKaspa?.trim()) return [];
  try {
    const addr = payerKaspa.trim();
    const keys = Array.from(
      new Set([diamondVeinsStorageKey(addr), diamondVeinsStorageKey(addr.toLowerCase())]),
    );
    const parsed = readJsonFromKeys(keys);
    if (!parsed || typeof parsed !== 'object') return [];
    const slots = (parsed as { slots?: MiningSlot[] }).slots;
    return Array.isArray(slots) ? slots : [];
  } catch {
    return [];
  }
}

function asCrewList(
  value: CrewNftUsageSlot | CrewNftUsageSlot[] | undefined,
): CrewNftUsageSlot[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : value ? [value] : [];
}

/**
 * Merge every Hub game NFT crew surface into one usage map.
 * Pass live arrays for the surface being edited; omit to read that game from localStorage.
 */
export function buildKasparexGlobalNftUsage(props: {
  payerKaspa: string | undefined;
  minecoreNftSlots?: MiningSlot[];
  tyconSlots?: MiningSlot[] | null;
  precisionOperative?: CrewNftUsageSlot | CrewNftUsageSlot[];
  cipherWardenSlots?: CrewNftUsageSlot | CrewNftUsageSlot[];
}): {
  usageByRef: Record<string, GlobalNftUsageRow[]>;
  inUseRefs: Set<string>;
} {
  const usageByRef: Record<string, GlobalNftUsageRow[]> = {};
  const inUseRefs = new Set<string>();

  const push = (ref: string, row: GlobalNftUsageRow) => {
    const key = normalizeNftRef(ref);
    usageByRef[key] = [...(usageByRef[key] ?? []), row];
    inUseRefs.add(key);
  };

  const minecore =
    props.minecoreNftSlots !== undefined
      ? props.minecoreNftSlots
      : readMinecoreNftSlotsFromMergedStorage(props.payerKaspa);
  minecore.forEach((s, idx) => {
    if (s.nftId == null || !s.collection) return;
    push(nftRefKey(s.collection, s.nftId), {
      entityType: 'minecore',
      entityId: 'workers',
      slotIndex: idx,
      href: '/games/minecore?tab=workers',
      label: `Minecore (${s.type}) #${idx + 1}`,
    });
  });

  const tycon =
    props.tyconSlots !== undefined
      ? props.tyconSlots ?? []
      : readTyconSlotsFromMergedStorage(props.payerKaspa);
  tycon.forEach((s, idx) => {
    if (s.nftId == null || !s.collection) return;
    push(nftRefKey(s.collection, s.nftId), {
      entityType: 'tycon',
      entityId: 'mining',
      slotIndex: idx,
      href: '/games/diamond-mining',
      label: `Diamond Veins (${s.type}) #${idx + 1}`,
    });
  });

  const ops =
    props.precisionOperative !== undefined
      ? asCrewList(props.precisionOperative)
      : readPrecisionOperativesFromStorage(props.payerKaspa);
  ops.forEach((op, idx) => {
    const hit = usageFromCrewSlot(op, idx, {
      entityType: 'precision-click',
      entityId: 'sync-operative',
      href: '/games/precision-click',
      label: `Precision Click · Sync Operative #${idx + 1}`,
    });
    if (hit) push(hit.ref, hit.row);
  });

  const wardens =
    props.cipherWardenSlots !== undefined
      ? asCrewList(props.cipherWardenSlots)
      : readCipherWardensFromStorage(props.payerKaspa);
  wardens.forEach((w, idx) => {
    const hit = usageFromCrewSlot(w, idx, {
      entityType: 'cipher-vaults',
      entityId: 'cipher-warden',
      href: '/games/cipher-vaults',
      label: `Cipher Vaults · Cipher Warden #${idx + 1}`,
    });
    if (hit) push(hit.ref, hit.row);
  });

  return { usageByRef, inUseRefs };
}

/** @deprecated Prefer buildKasparexGlobalNftUsage. */
export function buildGlobalNftRefsForMinecoreWorkers(props: {
  payerKaspa: string | undefined;
  minecoreNftSlots: MiningSlot[];
  tyconSlots?: MiningSlot[] | null;
  precisionOperative?: CrewNftUsageSlot | CrewNftUsageSlot[];
  cipherWardenSlots?: CrewNftUsageSlot | CrewNftUsageSlot[];
}): {
  usageByRef: Record<string, GlobalNftUsageRow[]>;
  inUseRefs: Set<string>;
} {
  return buildKasparexGlobalNftUsage(props);
}

/**
 * Enforce the global one-NFT-one-slot rule at assignment time (not only in the modal).
 */
export function assertNftRefGloballyFree(opts: {
  payerKaspa: string | undefined;
  collection: string;
  tokenId: number;
  exclude: GlobalNftSlotContext;
  minecoreNftSlots?: MiningSlot[];
  tyconSlots?: MiningSlot[] | null;
  precisionOperative?: CrewNftUsageSlot | CrewNftUsageSlot[];
  cipherWardenSlots?: CrewNftUsageSlot | CrewNftUsageSlot[];
}): { ok: true } | { ok: false; usedIn: GlobalNftUsageRow } {
  const { usageByRef } = buildKasparexGlobalNftUsage({
    payerKaspa: opts.payerKaspa,
    minecoreNftSlots: opts.minecoreNftSlots,
    tyconSlots: opts.tyconSlots,
    precisionOperative: opts.precisionOperative,
    cipherWardenSlots: opts.cipherWardenSlots,
  });
  const conflict = findGlobalNftConflict(
    nftRefKey(opts.collection, opts.tokenId),
    usageByRef,
    opts.exclude,
  );
  if (conflict) return { ok: false, usedIn: conflict };
  return { ok: true };
}

export function globalNftConflictMessage(usedIn: GlobalNftUsageRow): string {
  return `This NFT is already used in ${usedIn.label}. Remove it there before slotting it elsewhere.`;
}
