'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { htmlToPlainText, normalizeQuillHtml } from '@/lib/richText/html';
import 'quill/dist/quill.snow.css';

const TOOLBAR = [
  ['undo', 'redo'],
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }],
  ['link', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }],
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
];

const TOOLBAR_GAP = 8;

type QuillInstance = InstanceType<(typeof import('quill'))['default']>;

export interface KxRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function setupFloatingToolbar(quill: QuillInstance, toolbarEl: HTMLElement) {
  toolbarEl.classList.add('kx-quill-floating-toolbar');
  toolbarEl.style.zIndex = '999999';
  document.body.appendChild(toolbarEl);

  let repositionRaf = 0;

  const hideToolbar = () => {
    toolbarEl.classList.remove('is-visible');
  };

  const positionToolbar = () => {
    const range = quill.getSelection();
    if (!range || range.length === 0) {
      hideToolbar();
      return;
    }

    const bounds = quill.getBounds(range.index, range.length);
    if (!bounds) {
      hideToolbar();
      return;
    }

    toolbarEl.classList.add('is-visible');

    const editorRect = quill.root.getBoundingClientRect();
    const anchorX = editorRect.left + bounds.left + bounds.width / 2;
    const top = editorRect.top + bounds.top + bounds.height + TOOLBAR_GAP;
    const toolbarWidth = toolbarEl.offsetWidth;
    const left = clamp(
      anchorX,
      TOOLBAR_GAP + toolbarWidth / 2,
      window.innerWidth - TOOLBAR_GAP - toolbarWidth / 2,
    );

    toolbarEl.style.left = `${left}px`;
    toolbarEl.style.top = `${top}px`;
  };

  const scheduleReposition = () => {
    cancelAnimationFrame(repositionRaf);
    repositionRaf = requestAnimationFrame(positionToolbar);
  };

  toolbarEl.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });

  quill.on('selection-change', scheduleReposition);
  quill.on('text-change', scheduleReposition);

  window.addEventListener('scroll', scheduleReposition, true);
  window.addEventListener('resize', scheduleReposition);

  const resizeObserver = new ResizeObserver(scheduleReposition);
  resizeObserver.observe(quill.root);

  scheduleReposition();

  return () => {
    cancelAnimationFrame(repositionRaf);
    window.removeEventListener('scroll', scheduleReposition, true);
    window.removeEventListener('resize', scheduleReposition);
    resizeObserver.disconnect();
    toolbarEl.remove();
  };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const maxLengthRef = useRef(maxLength);
  const valueRef = useRef(value);
  const syncingRef = useRef(false);
  const [ready, setReady] = useState(false);

  const placeholderRef = useRef(placeholder);

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    maxLengthRef.current = maxLength;
    valueRef.current = value;
    placeholderRef.current = placeholder;
  });

  useEffect(() => {
    let destroyed = false;
    let cleanupFloatingToolbar: (() => void) | undefined;

    void (async () => {
      const { default: Quill } = await import('quill');
      if (destroyed || !containerRef.current) return;

      const container = containerRef.current;
      const editorEl = container.ownerDocument.createElement('div');
      container.appendChild(editorEl);

      const quill = new Quill(editorEl, {
        theme: 'snow',
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

      const toolbarEl = container.querySelector<HTMLElement>('.ql-toolbar');
      if (toolbarEl) {
        cleanupFloatingToolbar = setupFloatingToolbar(quill, toolbarEl);
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
      cleanupFloatingToolbar?.();
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
      className={`kx-quill-editor ${disabled ? 'pointer-events-none opacity-60' : ''} ${className}`.trim()}
      style={{ ['--kx-quill-min-height' as string]: `${minHeight}px` }}
    >
      {!ready ? (
        <div className="min-h-[120px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
      ) : null}
      <div ref={containerRef} className={ready ? '' : 'hidden'} />
    </div>
  );
}
