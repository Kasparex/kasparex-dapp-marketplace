'use client';

/** Platform-standard tag chip (listing sidebars, token pages, vBlog). */
export function kxTagChipClass(isSelected: boolean): string {
  return [
    'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold font-sans transition-all',
    isSelected
      ? 'bg-[#02abb8] text-white shadow-md shadow-[#02abb8]/20'
      : 'border border-zinc-200 bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
  ].join(' ');
}

export function KxTagChip({
  label,
  selected = false,
  onClick,
  prefix = '#',
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  prefix?: string;
}) {
  const className = kxTagChipClass(selected);
  const text = `${prefix}${label}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {text}
      </button>
    );
  }

  return <span className={className}>{text}</span>;
}
