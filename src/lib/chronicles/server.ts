import fs from 'fs';
import path from 'path';
import type { ChronicleChapter, ChronicleChapterMeta } from './types';
import { getChapterMetas } from './static-data';

function chroniclesRoot(): string {
  return path.join(process.cwd(), 'data', 'chronicles');
}

function readChapterBody(bodyPath: string): string {
  const full = path.join(chroniclesRoot(), bodyPath);
  return fs.readFileSync(full, 'utf8');
}

function hydrateChapter(meta: ChronicleChapterMeta): ChronicleChapter {
  return {
    ...meta,
    bodyMarkdown: readChapterBody(meta.bodyPath),
  };
}

/** Server-only: reads markdown from disk. */
export function getChapterBySlug(slug: string): ChronicleChapter | null {
  const meta = getChapterMetas().find((c) => c.slug === slug);
  if (!meta || meta.status === 'draft') return null;
  return hydrateChapter(meta);
}

/** Server-only */
export function getAllChapters(): ChronicleChapter[] {
  return getChapterMetas().map(hydrateChapter);
}
