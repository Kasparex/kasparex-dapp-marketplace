import { getAllCharacters, getAllLocations, getChapterMetas, getAllVehicles } from './static-data';

export type RegistryEntityType = 'character' | 'location' | 'chapter' | 'vehicle';

export interface RegistryEntry {
  type: RegistryEntityType;
  slug: string;
  title: string;
}

/** Slug -> entry for wiki link resolution and search hints */
export function buildChroniclesRegistry(): Map<string, RegistryEntry> {
  const map = new Map<string, RegistryEntry>();

  for (const c of getChapterMetas()) {
    map.set(c.slug, { type: 'chapter', slug: c.slug, title: c.title });
  }
  for (const ch of getAllCharacters()) {
    map.set(ch.slug, { type: 'character', slug: ch.slug, title: ch.name });
  }
  for (const loc of getAllLocations()) {
    map.set(loc.slug, { type: 'location', slug: loc.slug, title: loc.name });
  }
  for (const v of getAllVehicles()) {
    map.set(v.slug, { type: 'vehicle', slug: v.slug, title: v.name });
  }

  return map;
}

let cached: Map<string, RegistryEntry> | null = null;

export function getRegistry(): Map<string, RegistryEntry> {
  if (!cached) cached = buildChroniclesRegistry();
  return cached;
}
