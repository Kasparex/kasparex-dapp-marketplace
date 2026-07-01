'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { htmlToPlainText, normalizeQuillHtml } from '@/lib/richText/html';
import { insertDivider, mountFloatingToolbarPortal, registerKxQuillExtras } from '@/lib/richText/quillSetup';
import 'quill/dist/quill.bubble.css';

const TOOLBAR = [
  ['undo', 'redo'],
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }],
  ['link', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['divider-solid', 'divider-dashed', 'divider-dotted'],
  ['clean'],
];

const FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'color',
  'link',
  'blockquote',
  'list',
  'divider',
];

type QuillInstance = InstanceType<(typeof import('quill'))['default']>;

export interface KxRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  /** When true (default), formatting toolbar floats above the current text selection. */
  floatingToolbar?: boolean;
}

export function KxRichTextEditor({
  value,
  onChange,
  className = '',
  minRows = 6,
  disabled,
  placeholder,
  maxLength,
  floatingToolbar = true,
}: KxRichTextEditorProps) {
  const minHeight = Math.max(96, minRows * 26);
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const maxLengthRef = useRef(maxLength);
  const valueRef = useRef(value);
  const syncingRef = useRef(false);
  const cleanupToolbarRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  const placeholderRef = useRef(placeholder);
  const floatingToolbarRef = useRef(floatingToolbar);

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    maxLengthRef.current = maxLength;
    valueRef.current = value;
    placeholderRef.current = placeholder;
    floatingToolbarRef.current = floatingToolbar;
  });

  useEffect(() => {
    let destroyed = false;

    void (async () => {
      const { default: Quill } = await import('quill');
      if (destroyed || !containerRef.current) return;

      registerKxQuillExtras(Quill);

      const container = containerRef.current;
      const editorEl = container.ownerDocument.createElement('div');
      container.appendChild(editorEl);

      const quill = new Quill(editorEl, {
        theme: floatingToolbarRef.current ? 'bubble' : 'snow',
        placeholder: placeholderRef.current,
        readOnly: disabled,
        modules: {
          toolbar: {
            container: TOOLBAR,
            handlers: {
              undo(this: { quill: QuillInstance }) {
                this.quill.history.undo();
              },
              redo(this: { quill: QuillInstance }) {
                this.quill.history.redo();
              },
              'divider-solid'(this: { quill: QuillInstance }) {
                insertDivider(this.quill, 'solid');
              },
              'divider-dashed'(this: { quill: QuillInstance }) {
                insertDivider(this.quill, 'dashed');
              },
              'divider-dotted'(this: { quill: QuillInstance }) {
                insertDivider(this.quill, 'dotted');
              },
            },
          },
          history: {
            delay: 400,
            maxStack: 200,
            userOnly: true,
          },
        },
        formats: FORMATS,
      });

      quillRef.current = quill;

      if (floatingToolbarRef.current) {
        cleanupToolbarRef.current = mountFloatingToolbarPortal(quill, editorEl);
      }

      if (valueRef.current) {
        syncingRef.current = true;
        quill.clipboard.dangerouslyPasteHTML(valueRef.current);
        syncingRef.current = false;
      }

      quill.on('text-change', (_delta, _old, source) => {
        if (syncingRef.current || source !== 'user') return;

        const html = normalizeQuillHtml(quill.root.innerHTML);
        if (maxLengthRef.current != null) {
          const plainLen = htmlToPlainText(html).length;
          if (plainLen > maxLengthRef.current) {
            quill.history.undo();
            return;
          }
        }

        valueRef.current = html;
        onChangeRef.current(html);
      });

      if (!destroyed) setReady(true);
    })();

    return () => {
      destroyed = true;
      cleanupToolbarRef.current?.();
      cleanupToolbarRef.current = null;
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || !ready) return;

    const current = normalizeQuillHtml(quill.root.innerHTML);
    if (value === current) return;

    const selection = quill.getSelection();
    syncingRef.current = true;
    quill.clipboard.dangerouslyPasteHTML(value || '');
    syncingRef.current = false;
    valueRef.current = value;

    if (selection) {
      quill.setSelection(selection);
    }
  }, [value, ready]);

  useEffect(() => {
    quillRef.current?.enable(!disabled);
  }, [disabled, ready]);

  return (
    <div
      className={`kx-quill-editor ${floatingToolbar ? 'kx-quill-editor--floating' : 'kx-quill-editor--fixed'} ${disabled ? 'pointer-events-none opacity-60' : ''} ${className}`.trim()}
      style={{ ['--kx-quill-min-height' as string]: `${minHeight}px` }}
    >
      {!ready ? (
        <div className="min-h-[120px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
      ) : null}
      <div ref={containerRef} className={ready ? '' : 'hidden'} />
      {floatingToolbar && ready ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Select text to open the formatting toolbar above your selection. Divider buttons insert solid, dashed, or dotted lines.
        </p>
      ) : null}
    </div>
  );
}
