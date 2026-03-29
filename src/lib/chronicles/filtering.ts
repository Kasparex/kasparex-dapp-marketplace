import type { ChronicleChapterMeta } from './types';
import type { ChronicleCharacter } from './types';
import type { ChronicleLocation } from './types';
import type { ChronicleVehicle } from './types';

export function searchChapters(items: ChronicleChapterMeta[], q: string): ChronicleChapterMeta[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (c) =>
      c.title.toLowerCase().includes(s) ||
      c.teaser.toLowerCase().includes(s) ||
      c.slug.toLowerCase().includes(s)
  );
}

export function filterChaptersByTimeline(
  items: ChronicleChapterMeta[],
  timelines: ChronicleChapterMeta['timeline'][]
): ChronicleChapterMeta[] {
  if (timelines.length === 0) return items;
  return items.filter((c) => timelines.includes(c.timeline));
}

export function searchCharacters(items: ChronicleCharacter[], q: string): ChronicleCharacter[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(s) ||
      c.summary.toLowerCase().includes(s) ||
      c.slug.toLowerCase().includes(s) ||
      c.tags.some((t) => t.toLowerCase().includes(s))
  );
}

export function filterCharactersByKind(
  items: ChronicleCharacter[],
  kinds: ChronicleCharacter['kind'][]
): ChronicleCharacter[] {
  if (kinds.length === 0) return items;
  return items.filter((c) => kinds.includes(c.kind));
}

export function filterLocationsByTag(items: ChronicleLocation[], tag: string): ChronicleLocation[] {
  const t = tag.trim();
  if (!t) return items;
  return items.filter((l) => l.tags.includes(t));
}

export function searchLocations(items: ChronicleLocation[], q: string): ChronicleLocation[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (l) =>
      l.name.toLowerCase().includes(s) ||
      l.summary.toLowerCase().includes(s) ||
      l.slug.toLowerCase().includes(s) ||
      l.tags.some((t) => t.toLowerCase().includes(s))
  );
}

export function searchVehicles(items: ChronicleVehicle[], q: string): ChronicleVehicle[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (v) =>
      v.name.toLowerCase().includes(s) ||
      v.summary.toLowerCase().includes(s) ||
      v.slug.toLowerCase().includes(s) ||
      v.tags.some((t) => t.toLowerCase().includes(s))
  );
}

export function filterVehiclesByKind(
  items: ChronicleVehicle[],
  kinds: ChronicleVehicle['kind'][]
): ChronicleVehicle[] {
  if (kinds.length === 0) return items;
  return items.filter((v) => kinds.includes(v.kind));
}
