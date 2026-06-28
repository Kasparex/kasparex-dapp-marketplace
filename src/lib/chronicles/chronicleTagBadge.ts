import type { KxBadgeVariant } from '@/components/ui/KxBadge';
import type { CharacterKind, ChronicleTimeline, VehicleKind } from '@/lib/chronicles/types';

const TAG_VARIANT_MAP: Record<string, KxBadgeVariant> = {
  protagonist: 'cyan',
  ally: 'emerald',
  antagonist: 'rose',
  mystery: 'violet',
  ai: 'violet',
  faction: 'rose',
  threat: 'rose',
  city: 'cyan',
  hq: 'teal',
  network: 'indigo',
  kaspa: 'sky',
  'krex-token': 'amber',
  minecore: 'emerald',
  crossover: 'orange',
  garage: 'orange',
  coder: 'sky',
  hologram: 'violet',
  erasure: 'rose',
  'primary-setting': 'cyan',
  vantage: 'teal',
  anomaly: 'violet',
  article: 'sky',
  lore: 'violet',
  plant: 'emerald',
  industrial: 'orange',
  facility: 'teal',
};

const FALLBACK_VARIANTS: KxBadgeVariant[] = [
  'cyan',
  'emerald',
  'violet',
  'amber',
  'rose',
  'teal',
  'sky',
  'orange',
  'indigo',
];

const ABILITY_VARIANTS: KxBadgeVariant[] = ['violet', 'emerald', 'cyan', 'amber', 'rose', 'indigo', 'teal', 'sky'];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * 17) % FALLBACK_VARIANTS.length;
  }
  return hash;
}

export function chronicleTagBadgeVariant(tag: string): KxBadgeVariant {
  const key = tag.trim().toLowerCase();
  return TAG_VARIANT_MAP[key] ?? FALLBACK_VARIANTS[hashString(key)];
}

export function chronicleAbilityBadgeVariant(index: number): KxBadgeVariant {
  return ABILITY_VARIANTS[index % ABILITY_VARIANTS.length];
}

export function chronicleCharacterKindBadgeVariant(kind: CharacterKind): KxBadgeVariant {
  const map: Record<CharacterKind, KxBadgeVariant> = {
    person: 'cyan',
    ai: 'violet',
    faction: 'rose',
    organization: 'indigo',
    unknown: 'zinc',
  };
  return map[kind];
}

export function chronicleVehicleKindBadgeVariant(kind: VehicleKind): KxBadgeVariant {
  const map: Record<VehicleKind, KxBadgeVariant> = {
    vehicle: 'cyan',
    device: 'violet',
    tool: 'amber',
    weapon: 'rose',
  };
  return map[kind];
}

export function chronicleTimelineBadgeVariant(timeline: ChronicleTimeline): KxBadgeVariant {
  const map: Record<ChronicleTimeline, KxBadgeVariant> = {
    past: 'zinc',
    current: 'cyan',
    future: 'emerald',
  };
  return map[timeline];
}
