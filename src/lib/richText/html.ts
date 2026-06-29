import { parseMarkdown } from '@/lib/vblog/utils';

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isRichHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  return /^<[a-z][\s\S]*>/i.test(trimmed);
}

export function normalizeQuillHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === '<p><br></p>' || trimmed === '<p></p>') return '';
  return html;
}

/** Render stored article/comment body (HTML from Quill or legacy markdown). */
export function renderRichContent(content: string): string {
  if (!content) return '';
  if (isRichHtmlContent(content)) return content;
  return parseMarkdown(content);
}

/** Convert legacy markdown to HTML for loading into Quill. */
export function contentForRichEditor(content: string): string {
  if (!content) return '';
  if (isRichHtmlContent(content)) return content;
  return parseMarkdown(content);
}
