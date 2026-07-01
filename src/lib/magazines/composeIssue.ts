'use client';

import { getArticleBySlug } from '@/lib/vblog/data';
import type { VBlogArticle } from '@/lib/vblog/types';
import { renderRichContent } from '@/lib/richText/html';
import type { MagazineIssueManifest, MagazineSection } from './manifest';
import { getManifestSections } from './manifest';

export interface ComposedTextSection {
  kind: 'text';
  title?: string;
  html: string;
}

export interface ComposedArticleSection {
  kind: 'article';
  article: VBlogArticle;
  html: string;
  includePremium: boolean;
}

export type ComposedSection = ComposedTextSection | ComposedArticleSection;

export function getArticleBodyForMagazine(article: VBlogArticle, includePremium: boolean): string {
  let body = article.content ?? '';
  if (includePremium && article.modules?.premiumSectionEnabled && article.modules.premiumSectionContent) {
    body += `\n\n${article.modules.premiumSectionContent}`;
  }
  return renderRichContent(body);
}

export function composeSection(section: MagazineSection): ComposedSection | null {
  if (section.type === 'vblog_article' && section.slug) {
    const article = getArticleBySlug(section.slug);
    if (!article) {
      return {
        kind: 'text',
        title: 'Missing article',
        html: `<p>Article <strong>${section.slug}</strong> is not available in this browser session.</p>`,
      };
    }
    return {
      kind: 'article',
      article,
      html: getArticleBodyForMagazine(article, section.includePremium === true),
      includePremium: section.includePremium === true,
    };
  }

  if (section.type === 'header' && section.content) {
    return { kind: 'text', title: section.content, html: '' };
  }

  if (section.type === 'text' && section.content) {
    return { kind: 'text', html: renderRichContent(section.content) };
  }

  if (section.type === 'cover') {
    return { kind: 'text', title: section.content ?? 'Cover', html: '' };
  }

  return null;
}

export function composeIssueFromManifest(manifest: MagazineIssueManifest): ComposedSection[] {
  const sections = getManifestSections(manifest);
  const out: ComposedSection[] = [];
  for (const section of sections) {
    const composed = composeSection(section);
    if (composed) out.push(composed);
  }
  return out;
}
