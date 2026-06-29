'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { htmlToPlainText, normalizeQuillHtml } from '@/lib/richText/html';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[120px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
  ),
});

const TOOLBAR = [
  ['undo', 'redo'],
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }],
  ['link', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['clean'],
] as (string | { header: (number | false)[] } | { list: string })[];

const FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'color',
  'link',
  'blockquote',
  'list',
];

export interface KxRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export function KxRichTextEditor({
  value,
  onChange,
  className = '',
  minRows = 6,
  disabled,
  placeholder,
  maxLength,
}: KxRichTextEditorProps) {
  const minHeight = Math.max(96, minRows * 26);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: TOOLBAR,
        handlers: {
          undo: function (this: { quill: { history: { undo: () => void } } }) {
            this.quill.history.undo();
          },
          redo: function (this: { quill: { history: { redo: () => void } } }) {
            this.quill.history.redo();
          },
        },
      },
      history: {
        delay: 400,
        maxStack: 200,
        userOnly: true,
      },
    }),
    [],
  );

  const handleChange = (html: string) => {
    const normalized = normalizeQuillHtml(html);
    if (maxLength != null) {
      const plainLen = htmlToPlainText(normalized).length;
      if (plainLen > maxLength) return;
    }
    onChange(normalized);
  };

  return (
    <div
      className={`kx-quill-editor ${disabled ? 'pointer-events-none opacity-60' : ''} ${className}`.trim()}
      style={{ ['--kx-quill-min-height' as string]: `${minHeight}px` }}
    >
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        readOnly={disabled}
      />
    </div>
  );
}
