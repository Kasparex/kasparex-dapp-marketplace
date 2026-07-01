'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { htmlToPlainText, normalizeQuillHtml } from '@/lib/richText/html';
import 'quill/dist/quill.snow.css';

const TOOLBAR = [
  ['undo', 'redo'],
  [{ header: [2, 3, false] }],
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

const FLOATING_TOOLBAR_Z = 999999;
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

function setupFloatingToolbar(
  quill: QuillInstance,
  toolbarEl: HTMLElement,
  floatingHost: HTMLElement,
) {
  const mainRow = document.createElement('div');
  mainRow.className = 'kx-quill-toolbar-main';

  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'kx-quill-toolbar-more';
  moreBtn.setAttribute('aria-label', 'More formatting options');
  moreBtn.setAttribute('aria-haspopup', 'true');
  moreBtn.setAttribute('aria-expanded', 'false');
  moreBtn.hidden = true;

  const overflowMenu = document.createElement('div');
  overflowMenu.className = 'kx-quill-toolbar-overflow';
  overflowMenu.hidden = true;
  overflowMenu.setAttribute('role', 'menu');

  const toolbarInner = document.createElement('div');
  toolbarInner.className = 'kx-quill-toolbar-inner';

  while (toolbarEl.firstChild) {
    mainRow.appendChild(toolbarEl.firstChild);
  }

  toolbarInner.append(mainRow, moreBtn, overflowMenu);
  toolbarEl.append(toolbarInner);
  floatingHost.append(toolbarEl);

  let overflowOpen = false;
  let repositionRaf = 0;

  const getControls = () =>
    Array.from(mainRow.querySelectorAll<HTMLElement>(':scope > *'));

  const closeOverflow = () => {
    overflowOpen = false;
    overflowMenu.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
  };

  const openOverflow = () => {
    overflowOpen = true;
    overflowMenu.hidden = false;
    moreBtn.setAttribute('aria-expanded', 'true');
  };

  const updateOverflow = () => {
    const controls = getControls();
    for (const control of controls) {
      if (control.parentElement === overflowMenu) {
        mainRow.appendChild(control);
      }
      control.hidden = false;
      control.style.removeProperty('display');
    }

    overflowMenu.replaceChildren();
    closeOverflow();

    const availableWidth = toolbarInner.clientWidth;
    if (availableWidth <= 0) return;

    moreBtn.hidden = false;
    const moreWidth = moreBtn.offsetWidth || 32;
    moreBtn.hidden = true;

    let usedWidth = 0;
    const hidden: HTMLElement[] = [];

    for (const control of controls) {
      const width = control.offsetWidth;
      const needsMore = hidden.length > 0 || usedWidth + width + moreWidth > availableWidth;
      if (needsMore) {
        hidden.push(control);
      } else {
        usedWidth += width;
      }
    }

    if (hidden.length === 0) {
      moreBtn.hidden = true;
      return;
    }

    moreBtn.hidden = false;
    for (const control of hidden) {
      overflowMenu.appendChild(control);
    }
  };

  const positionToolbar = () => {
    const range = quill.getSelection();
    if (!range) {
      floatingHost.hidden = true;
      closeOverflow();
      return;
    }

    const bounds = quill.getBounds(range.index, range.length);
    if (!bounds) {
      floatingHost.hidden = true;
      closeOverflow();
      return;
    }

    const editorRect = quill.root.getBoundingClientRect();
    floatingHost.hidden = false;

    updateOverflow();

    const hostWidth = floatingHost.offsetWidth;
    const hostHeight = floatingHost.offsetHeight;

    const anchorX = editorRect.left + bounds.left + bounds.width / 2;
    let top = editorRect.top + bounds.top - TOOLBAR_GAP;
    let placeBelow = false;

    if (top - hostHeight < TOOLBAR_GAP) {
      top = editorRect.top + bounds.top + bounds.height + TOOLBAR_GAP;
      placeBelow = true;
    }

    const left = clamp(
      anchorX,
      TOOLBAR_GAP + hostWidth / 2,
      window.innerWidth - TOOLBAR_GAP - hostWidth / 2,
    );

    floatingHost.style.left = `${left}px`;
    floatingHost.style.top = `${top}px`;
    floatingHost.dataset.placement = placeBelow ? 'below' : 'above';
  };

  const scheduleReposition = () => {
    cancelAnimationFrame(repositionRaf);
    repositionRaf = requestAnimationFrame(positionToolbar);
  };

  moreBtn.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });

  moreBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (overflowOpen) {
      closeOverflow();
    } else {
      openOverflow();
    }
  });

  document.addEventListener('mousedown', (event) => {
    if (!overflowOpen) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (floatingHost.contains(target)) return;
    closeOverflow();
  });

  quill.on('selection-change', scheduleReposition);
  quill.on('text-change', scheduleReposition);

  window.addEventListener('scroll', scheduleReposition, true);
  window.addEventListener('resize', scheduleReposition);

  const resizeObserver = new ResizeObserver(scheduleReposition);
  resizeObserver.observe(quill.root);
  resizeObserver.observe(toolbarInner);

  scheduleReposition();

  return () => {
    cancelAnimationFrame(repositionRaf);
    window.removeEventListener('scroll', scheduleReposition, true);
    window.removeEventListener('resize', scheduleReposition);
    resizeObserver.disconnect();
    closeOverflow();
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
  const floatingToolbarRef = useRef<HTMLDivElement>(null);
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
      if (destroyed || !containerRef.current || !floatingToolbarRef.current) return;

      const container = containerRef.current;
      const floatingHost = floatingToolbarRef.current;
      const editorEl = container.ownerDocument.createElement('div');
      container.appendChild(editorEl);

      const toolbarEl = container.ownerDocument.createElement('div');
      toolbarEl.className = 'ql-toolbar ql-snow kx-quill-floating-toolbar-panel';

      const quill = new Quill(editorEl, {
        theme: 'snow',
        placeholder: placeholderRef.current,
        readOnly: disabled,
        modules: {
          toolbar: {
            container: toolbarEl,
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
      cleanupFloatingToolbar = setupFloatingToolbar(quill, toolbarEl, floatingHost);

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
      if (floatingToolbarRef.current) floatingToolbarRef.current.innerHTML = '';
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
      <div
        ref={floatingToolbarRef}
        className="kx-quill-floating-toolbar-host"
        hidden
        style={{ zIndex: FLOATING_TOOLBAR_Z }}
      />
      <div ref={containerRef} className={ready ? '' : 'hidden'} />
    </div>
  );
}
