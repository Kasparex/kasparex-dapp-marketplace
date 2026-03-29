export type ChronicleStatus = 'published' | 'draft' | 'upcoming';

export type ChronicleTimeline = 'past' | 'current' | 'future';

export type CharacterKind = 'person' | 'ai' | 'faction' | 'organization' | 'unknown';

export type CharacterRole = 'Hero' | 'Hacker' | 'AI' | 'Enemy' | 'Unknown' | 'Ally';

export type StoryStatus = 'Active' | 'Unknown' | 'Eliminated';

export type VehicleKind = 'vehicle' | 'tool' | 'weapon' | 'device';

export type TokenLaunchStatus = 'not-launched' | 'coming' | 'live';

export type ChronicleAccessTier = 'free' | 'early' | 'premium';

/** Maps catalog entities to `entitlements-catalog.json` ids for wallet gating. */
export interface ChronicleAccessMeta {
  contentId: string;
  tier: ChronicleAccessTier;
}

export interface ChronicleOverview {
  title: string;
  tagline: string;
  bodyMarkdown: string;
  /** Optional hero image URL (Pinata, placehold.co, etc.). Empty uses UI placeholder. */
  featuredImageUrl?: string;
}

export interface ChronicleFragment {
  id: string;
  title: string;
  bodyMarkdown: string;
  tags: string[];
  featuredImageUrl?: string;
}

export interface ChronicleChapterMeta {
  slug: string;
  number: number;
  title: string;
  teaser: string;
  status: ChronicleStatus;
  timeline: ChronicleTimeline;
  highlightCharacterSlugs: string[];
  locationSlugs: string[];
  relatedGameSlug?: string;
  /** Relative to data/chronicles/, e.g. bodies/chapter-01.md */
  bodyPath: string;
  featuredImageUrl?: string;
  access?: ChronicleAccessMeta;
}

export interface ChronicleChapter extends ChronicleChapterMeta {
  bodyMarkdown: string;
}

export interface CharacterRelationship {
  characterSlug: string;
  relation: string;
}

export interface ChronicleCharacter {
  slug: string;
  name: string;
  kind: CharacterKind;
  role: CharacterRole;
  summary: string;
  bodyMarkdown: string;
  abilities: string[];
  firstAppearanceChapterSlug?: string;
  relationships: CharacterRelationship[];
  storyStatus: StoryStatus;
  factionTag?: string;
  tags: string[];
  token: {
    status: TokenLaunchStatus;
    contractAddress?: string;
    utility?: string;
  };
  featuredImageUrl?: string;
}

export interface ChronicleLocation {
  slug: string;
  name: string;
  summary: string;
  bodyMarkdown: string;
  visualStyle: string;
  roleInStory: string;
  chapterSlugs: string[];
  characterSlugs: string[];
  relatedGameSlug?: string;
  secretsMarkdown?: string;
  tags: string[];
  featuredImageUrl?: string;
}

export interface ChronicleVehicle {
  slug: string;
  name: string;
  kind: VehicleKind;
  summary: string;
  bodyMarkdown: string;
  ownerCharacterSlug?: string;
  chapterSlugs: string[];
  tags: string[];
  featuredImageUrl?: string;
}

export type ChroniclesViewMode = 'card' | 'compact' | 'table';
