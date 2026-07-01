import type Quill from 'quill';

export type DividerStyle = 'solid' | 'dashed' | 'dotted';

type QuillConstructor = typeof Quill;
type QuillInstance = InstanceType<QuillConstructor>;

let quillExtrasRegistered = false;

const DIVIDER_ICON =
  '<svg viewBox="0 0 18 18"><line class="ql-stroke" x1="3" x2="15" y1="9" y2="9"></line></svg>';

export function registerKxQuillExtras(QuillCtor: QuillConstructor) {
  if (quillExtrasRegistered) return;
  quillExtrasRegistered = true;

  const icons = QuillCtor.import('ui/icons') as Record<string, string>;
  icons['divider-solid'] = DIVIDER_ICON;
  icons['divider-dashed'] = DIVIDER_ICON.replace(
    '<line class="ql-stroke"',
    '<line class="ql-stroke" stroke-dasharray="3,2"',
  );
  icons['divider-dotted'] = DIVIDER_ICON.replace(
    '<line class="ql-stroke"',
    '<line class="ql-stroke" stroke-dasharray="1,2"',
  );

  const BlockEmbed = QuillCtor.import('blots/block/embed') as {
    new (): { domNode: HTMLElement };
    create(value?: unknown): HTMLElement;
    scope: unknown;
  };

  class DividerBlot extends BlockEmbed {
    static blotName = 'divider';

    static tagName = 'HR';

    static scope = BlockEmbed.scope;

    static create(value: DividerStyle) {
      const node = super.create() as HTMLElement;
      const style: DividerStyle =
        value === 'dashed' || value === 'dotted' ? value : 'solid';
      node.setAttribute('class', `kx-divider kx-divider--${style}`);
      node.setAttribute('contenteditable', 'false');
      return node;
    }

    static value(node: HTMLElement): DividerStyle {
      if (node.classList.contains('kx-divider--dashed')) return 'dashed';
      if (node.classList.contains('kx-divider--dotted')) return 'dotted';
      return 'solid';
    }
  }

  QuillCtor.register(
    { [`formats/${DividerBlot.blotName}`]: DividerBlot as Record<string, unknown> },
    true,
  );
}

export function insertDivider(quill: QuillInstance, style: DividerStyle) {
  const range = quill.getSelection(true);
  const index = range?.index ?? quill.getLength();
  quill.insertEmbed(index, 'divider', style, 'user');
  quill.insertText(index + 1, '\n', 'user');
  quill.setSelection(index + 2, 0, 'silent');
}

export function mountFloatingToolbarPortal(quill: QuillInstance, editorRoot: HTMLElement) {
  const container = editorRoot.closest('.ql-container') ?? editorRoot.parentElement;
  const tooltip = container?.querySelector('.ql-tooltip') as HTMLElement | null;
  if (!tooltip) return () => {};

  tooltip.classList.add('kx-quill-floating-toolbar');
  const originalParent = tooltip.parentElement;
  document.body.appendChild(tooltip);

  const reposition = () => {
    const range = quill.getSelection();
    if (range == null) return;

    const bounds = quill.getBounds(range.index, Math.max(range.length, 0));
    if (!bounds) return;

    const editorRect = quill.root.getBoundingClientRect();
    const tooltipHeight = tooltip.offsetHeight || 44;
    const tooltipWidth = tooltip.offsetWidth || 360;

    let top = editorRect.top + bounds.top - tooltipHeight - 10;
    const flip = top < 8;
    if (flip) {
      top = editorRect.top + bounds.bottom + 10;
      tooltip.classList.add('ql-flip');
    } else {
      tooltip.classList.remove('ql-flip');
    }

    let left = editorRect.left + bounds.left + bounds.width / 2 - tooltipWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

    tooltip.style.position = 'fixed';
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.zIndex = '99999';
    tooltip.style.transform = 'none';
  };

  const scheduleReposition = () => {
    requestAnimationFrame(reposition);
  };

  quill.on('selection-change', scheduleReposition);
  quill.on('text-change', scheduleReposition);

  const onViewportChange = () => scheduleReposition();
  window.addEventListener('scroll', onViewportChange, true);
  window.addEventListener('resize', onViewportChange);

  return () => {
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
    if (originalParent) {
      originalParent.appendChild(tooltip);
    } else {
      tooltip.remove();
    }
  };
}
