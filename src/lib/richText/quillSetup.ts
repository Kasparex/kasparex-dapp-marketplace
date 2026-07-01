type QuillInstance = InstanceType<(typeof import('quill'))['default']>;

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
