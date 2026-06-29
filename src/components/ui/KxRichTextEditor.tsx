'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from 'react';

type FormatAction =
  | 'bold'
  | 'italic'
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'divider'
  | 'link'
  | 'color';

const COLOR_PRESETS = ['#02abb8', '#ef4444', '#f59e0b', '#22c55e', '#6366f1', '#a855f7', '#ffffff', '#18181b'];

function wrapSelection(text: string, start: number, end: number, before: string, after: string): { next: string; selStart: number; selEnd: number } {
  const selected = text.slice(start, end);
  const next = text.slice(0, start) + before + selected + after + text.slice(end);
  const selStart = start + before.length;
  const selEnd = selStart + selected.length;
  return { next, selStart, selEnd };
}

function prefixLines(text: string, start: number, end: number, prefix: string): { next: string; selStart: number; selEnd: number } {
  const blockStart = text.lastIndexOf('\n', start - 1) + 1;
  const blockEnd = end === start ? end : text.indexOf('\n', end);
  const sliceEnd = blockEnd === -1 ? text.length : blockEnd;
  const block = text.slice(blockStart, sliceEnd);
  const lines = block.split('\n');
  const prefixed = lines
    .map((line) => {
      const trimmed = line.replace(/^#{1,3}\s+/, '');
      if (!trimmed.trim()) return line;
      return `${prefix}${trimmed}`;
    })
    .join('\n');
  const next = text.slice(0, blockStart) + prefixed + text.slice(sliceEnd);
  return { next, selStart: blockStart, selEnd: blockStart + prefixed.length };
}

function stripHeadingPrefix(text: string, start: number, end: number): { next: string; selStart: number; selEnd: number } {
  const blockStart = text.lastIndexOf('\n', start - 1) + 1;
  const blockEnd = end === start ? end : text.indexOf('\n', end);
  const sliceEnd = blockEnd === -1 ? text.length : blockEnd;
  const block = text.slice(blockStart, sliceEnd);
  const stripped = block.replace(/^#{1,3}\s+/gm, '');
  const next = text.slice(0, blockStart) + stripped + text.slice(sliceEnd);
  return { next, selStart: blockStart, selEnd: blockStart + stripped.length };
}

export interface KxRichTextEditorProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}

export function KxRichTextEditor({
  value,
  onChange,
  className = '',
  minRows = 6,
  disabled,
  placeholder,
  ...rest
}: KxRichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<CSSProperties>({ top: 0, left: 0 });
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const updateToolbarPosition = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      setToolbarVisible(false);
      setSelectionRange(null);
      return;
    }
    setSelectionRange({ start, end });

    const rect = el.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 24;
    const textBefore = el.value.slice(0, end);
    const lines = textBefore.split('\n');
    const lineIndex = lines.length - 1;
    const top = rect.top + window.scrollY + Math.min(lineIndex * lineHeight, el.clientHeight - 40) - 44;
    const left = rect.left + window.scrollX + 12;
    setToolbarPos({ top: Math.max(top, rect.top + window.scrollY - 48), left });
    setToolbarVisible(true);
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolbarRef.current?.contains(target) || textareaRef.current?.contains(target)) return;
      setToolbarVisible(false);
      setShowColorPicker(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const applyFormat = (action: FormatAction, color?: string) => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let result = { next: value, selStart: start, selEnd: end };

    switch (action) {
      case 'bold':
        result = wrapSelection(value, start, end, '**', '**');
        break;
      case 'italic':
        result = wrapSelection(value, start, end, '*', '*');
        break;
      case 'h2':
        result = prefixLines(value, start, end, '## ');
        break;
      case 'h3':
        result = prefixLines(value, start, end, '### ');
        break;
      case 'paragraph':
        result = stripHeadingPrefix(value, start, end);
        break;
      case 'divider': {
        const insert = '\n\n---\n\n';
        result = {
          next: value.slice(0, end) + insert + value.slice(end),
          selStart: end + insert.length,
          selEnd: end + insert.length,
        };
        break;
      }
      case 'link': {
        const selected = value.slice(start, end) || 'link text';
        const url = window.prompt('Enter link URL', 'https://');
        if (!url) return;
        const linked = `[${selected}](${url})`;
        result = {
          next: value.slice(0, start) + linked + value.slice(end),
          selStart: start,
          selEnd: start + linked.length,
        };
        break;
      }
      case 'color': {
        if (!color) return;
        result = wrapSelection(value, start, end, `{color:${color}}`, '{/color}');
        break;
      }
      default:
        break;
    }

    onChange(result.next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selStart, result.selEnd);
      updateToolbarPosition();
    });
    setShowColorPicker(false);
  };

  const toolbarBtn =
    'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors disabled:opacity-40';

  return (
    <div className="relative">
      {toolbarVisible && selectionRange ? (
        <div
          ref={toolbarRef}
          className="fixed z-[100] flex flex-wrap items-center gap-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-1 shadow-lg"
          style={toolbarPos}
          role="toolbar"
          aria-label="Text formatting"
        >
          <button type="button" className={toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('bold')} title="Bold">
            B
          </button>
          <button type="button" className={`${toolbarBtn} italic`} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('italic')} title="Italic">
            I
          </button>
          <span className="mx-0.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          <button type="button" className={toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('h2')} title="Large heading">
            L
          </button>
          <button type="button" className={toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('h3')} title="Medium heading">
            M
          </button>
          <button type="button" className={toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('paragraph')} title="Paragraph">
            P
          </button>
          <span className="mx-0.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="relative">
            <button
              type="button"
              className={toolbarBtn}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowColorPicker((v) => !v)}
              title="Text color"
            >
              <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-[#02abb8] to-violet-500" />
            </button>
            {showColorPicker ? (
              <div className="absolute left-0 top-full mt-1 flex flex-wrap gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg w-[140px]">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-600"
                    style={{ backgroundColor: c }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('color', c)}
                    title={c}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className={toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('link')} title="Link">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button type="button" className={toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('divider')} title="Divider">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
            </svg>
          </button>
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={updateToolbarPosition}
        onKeyUp={updateToolbarPosition}
        onMouseUp={updateToolbarPosition}
        disabled={disabled}
        placeholder={placeholder}
        rows={minRows}
        className={`k-textarea text-base leading-relaxed ${className}`.trim()}
        {...rest}
      />
    </div>
  );
}
