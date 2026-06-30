import type { MouseEventHandler } from 'react';
import { renderRichContent } from '@/lib/richText/html';
import { KX_QUILL_CONTENT_CLASS } from '@/lib/richText/constants';

type KxRichTextContentProps = {
  html: string;
  className?: string;
  id?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

/** Renders Quill (or legacy) HTML with the same typography as the editor. */
export function KxRichTextContent({ html, className = '', id, onClick }: KxRichTextContentProps) {
  const rendered = renderRichContent(html);
  if (!rendered) return null;

  return (
    <div
      id={id}
      className={`${KX_QUILL_CONTENT_CLASS} select-text ${className}`.trim()}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
