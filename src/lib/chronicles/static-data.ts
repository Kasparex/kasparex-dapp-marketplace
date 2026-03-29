import type {
  ChronicleChapterMeta,
  ChronicleCharacter,
  ChronicleFragment,
  ChronicleLocation,
  ChronicleOverview,
  ChronicleVehicle,
} from './types';
import chaptersMeta from '../../../data/chronicles/chapters.json';
import charactersJson from '../../../data/chronicles/characters.json';
import locationsJson from '../../../data/chronicles/locations.json';
import vehiclesJson from '../../../data/chronicles/vehicles.json';
import fragmentsJson from '../../../data/chronicles/fragments.json';
import overviewJson from '../../../data/chronicles/overview.json';

const metas = chaptersMeta as ChronicleChapterMeta[];
export const characters = charactersJson as ChronicleCharacter[];
export const locations = locationsJson as ChronicleLocation[];
export const vehicles = vehiclesJson as ChronicleVehicle[];
export const fragments = fragmentsJson as ChronicleFragment[];
export const overview = overviewJson as ChronicleOverview;

export function getOverview(): ChronicleOverview {
  return overview;
}

export function getFragments(): ChronicleFragment[] {
  return fragments;
}

export function getChapterMetas(): ChronicleChapterMeta[] {
  return metas.filter((c) => c.status !== 'draft');
}

export function getChapterSummaries(): ChronicleChapterMeta[] {
  return getChapterMetas().slice().sort((a, b) => a.number - b.number);
}

export function getAdjacentChapters(slug: string): {
  prev: ChronicleChapterMeta | null;
  next: ChronicleChapterMeta | null;
} {
  const sorted = getChapterSummaries();
  const i = sorted.findIndex((c) => c.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? sorted[i - 1]! : null,
    next: i < sorted.length - 1 ? sorted[i + 1]! : null,
  };
}

export function getAllCharacters(): ChronicleCharacter[] {
  return characters;
}

export function getCharacterBySlug(slug: string): ChronicleCharacter | null {
  return characters.find((c) => c.slug === slug) ?? null;
}

export function getAllLocations(): ChronicleLocation[] {
  return locations;
}

export function getLocationBySlug(slug: string): ChronicleLocation | null {
  return locations.find((l) => l.slug === slug) ?? null;
}

export function getAllVehicles(): ChronicleVehicle[] {
  return vehicles;
}

export function getVehicleBySlug(slug: string): ChronicleVehicle | null {
  return vehicles.find((v) => v.slug === slug) ?? null;
}

export function getAllChapterSlugs(): string[] {
  return getChapterMetas().map((c) => c.slug);
}

export function getAllCharacterSlugs(): string[] {
  return characters.map((c) => c.slug);
}

export function getAllLocationSlugs(): string[] {
  return locations.map((l) => l.slug);
}

export function getAllVehicleSlugs(): string[] {
  return vehicles.map((v) => v.slug);
}
