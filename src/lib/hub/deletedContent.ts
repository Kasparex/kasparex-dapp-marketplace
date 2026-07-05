'use client';

import type { HubContentKind } from '@/lib/hub/contentTypes';

const STORAGE_KEY = 'kasparex_hub_deleted_content_v1';

type DeletedMap = Partial<Record<HubContentKind, string[]>>;

function readDeleted(): DeletedMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeletedMap) : {};
  } catch {
    return {};
  }
}

function writeDeleted(map: DeletedMap): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function markHubContentDeleted(kind: HubContentKind, id: string): void {
  const map = readDeleted();
  const list = new Set(map[kind] ?? []);
  list.add(id);
  map[kind] = [...list];
  writeDeleted(map);
}

export function clearHubContentDeleted(kind: HubContentKind, id: string): void {
  const map = readDeleted();
  const list = (map[kind] ?? []).filter((x) => x !== id);
  if (list.length) map[kind] = list;
  else delete map[kind];
  writeDeleted(map);
}

export function getHubContentDeletedIds(kind: HubContentKind): Set<string> {
  return new Set(readDeleted()[kind] ?? []);
}

export function filterOutDeleted<T extends { id: string }>(kind: HubContentKind, items: T[]): T[] {
  const deleted = getHubContentDeletedIds(kind);
  if (!deleted.size) return items;
  return items.filter((item) => !deleted.has(item.id));
}
