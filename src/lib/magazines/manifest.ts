import type { ContributorShare } from './types';

export type MagazineSectionType =
  | 'cover'
  | 'header'
  | 'text'
  | 'image'
  | 'video'
  | 'vblog_article';

export interface MagazineSection {
  type: MagazineSectionType;
  content?: string;
  slug?: string;
  articleId?: string;
  includePremium?: boolean;
  alt?: string;
}

export interface MagazineIssueManifestV1 {
  version: 1;
  magazineId: string;
  magazineSlug: string;
  issueNumber: number;
  title: string;
  priceKAS: number;
  treasurySplitPct: number;
  contributors: ContributorShare[];
  blocks: Array<{ id: string; type: 'text' | 'image' | 'video' | 'header'; content: string }>;
  authoredBy: string;
  publishedAt: string;
}

export interface MagazineIssueManifestV2 {
  version: 2;
  magazineId: string;
  magazineSlug: string;
  issueNumber: number;
  title: string;
  priceKAS: number;
  treasurySplitPct: number;
  contributors: ContributorShare[];
  sections: MagazineSection[];
  authoredBy: string;
  publishedAt: string;
}

export type MagazineIssueManifest = MagazineIssueManifestV1 | MagazineIssueManifestV2;

export function blocksToSections(
  blocks: MagazineIssueManifestV1['blocks'],
): MagazineSection[] {
  return blocks.map((b) => ({
    type: b.type === 'header' ? 'header' : b.type,
    content: b.content,
  }));
}

export function normalizeManifest(raw: unknown): MagazineIssueManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const version = obj.version;
  if (version === 2 && Array.isArray(obj.sections)) {
    return obj as unknown as MagazineIssueManifestV2;
  }
  if (version === 1 && Array.isArray(obj.blocks)) {
    return obj as unknown as MagazineIssueManifestV1;
  }
  if (Array.isArray(obj.blocks)) {
    return { ...(obj as unknown as MagazineIssueManifestV1), version: 1 };
  }
  return null;
}

export function getManifestSections(manifest: MagazineIssueManifest): MagazineSection[] {
  if (manifest.version === 2) return manifest.sections;
  return blocksToSections(manifest.blocks);
}

export function buildManifestV2Payload(args: {
  magazineId: string;
  magazineSlug: string;
  issueNumber: number;
  title: string;
  priceKAS: number;
  treasurySplitPct: number;
  contributors: ContributorShare[];
  sections: MagazineSection[];
  authoredBy: string;
}): MagazineIssueManifestV2 {
  return {
    version: 2,
    magazineId: args.magazineId,
    magazineSlug: args.magazineSlug,
    issueNumber: args.issueNumber,
    title: args.title.trim(),
    priceKAS: args.priceKAS,
    treasurySplitPct: args.treasurySplitPct,
    contributors: args.contributors,
    sections: args.sections,
    authoredBy: args.authoredBy,
    publishedAt: new Date().toISOString(),
  };
}
