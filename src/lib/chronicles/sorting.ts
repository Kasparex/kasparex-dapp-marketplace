import type { ChronicleChapterMeta } from './types';
import type { ChronicleCharacter } from './types';
import type { ChronicleLocation } from './types';
import type { ChronicleVehicle } from './types';

export function sortChaptersByNumber(items: ChronicleChapterMeta[]): ChronicleChapterMeta[] {
  return items.slice().sort((a, b) => a.number - b.number);
}

export function sortCharactersByName(items: ChronicleCharacter[]): ChronicleCharacter[] {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function sortLocationsByName(items: ChronicleLocation[]): ChronicleLocation[] {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function sortVehiclesByName(items: ChronicleVehicle[]): ChronicleVehicle[] {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}
