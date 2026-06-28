import type { ChronicleChapterMeta, ChronicleCharacter, ChronicleLocation, ChronicleVehicle } from '@/lib/chronicles/types';
import type { ChroniclesCommunitySubmission } from '@/lib/chronicles/communitySubmissions';

export function communityChapterToMeta(sub: ChroniclesCommunitySubmission): ChronicleChapterMeta & { isCommunity: true } {
  return {
    slug: sub.slug,
    number: sub.chapterNumber ?? 9000,
    title: sub.title,
    teaser: sub.summary,
    status: 'published',
    timeline: sub.timeline ?? 'current',
    highlightCharacterSlugs: [],
    locationSlugs: [],
    bodyPath: '',
    featuredImageUrl: sub.featuredImageUrl,
    isCommunity: true,
  };
}

export function communityCharacterToEntity(sub: ChroniclesCommunitySubmission): ChronicleCharacter & { isCommunity: true } {
  return {
    slug: sub.slug,
    name: sub.title,
    kind: sub.characterKind ?? 'unknown',
    role: 'Unknown',
    summary: sub.summary,
    bodyMarkdown: sub.bodyMarkdown,
    abilities: [],
    relationships: [],
    storyStatus: 'Unknown',
    tags: sub.tags ?? [],
    token: { status: 'not-launched' },
    featuredImageUrl: sub.featuredImageUrl,
    isCommunity: true,
  };
}

export function communityLocationToEntity(sub: ChroniclesCommunitySubmission): ChronicleLocation & { isCommunity: true } {
  return {
    slug: sub.slug,
    name: sub.title,
    summary: sub.summary,
    bodyMarkdown: sub.bodyMarkdown,
    visualStyle: 'Community submission',
    roleInStory: 'Community lore',
    chapterSlugs: [],
    characterSlugs: [],
    tags: sub.tags ?? [],
    featuredImageUrl: sub.featuredImageUrl,
    isCommunity: true,
  };
}

export function communityVehicleToEntity(sub: ChroniclesCommunitySubmission): ChronicleVehicle & { isCommunity: true } {
  return {
    slug: sub.slug,
    name: sub.title,
    kind: sub.vehicleKind ?? 'device',
    summary: sub.summary,
    bodyMarkdown: sub.bodyMarkdown,
    chapterSlugs: [],
    tags: sub.tags ?? [],
    featuredImageUrl: sub.featuredImageUrl,
    isCommunity: true,
  };
}
