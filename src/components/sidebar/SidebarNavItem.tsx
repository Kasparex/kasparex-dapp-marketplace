'use client';

import type { ReactNode } from 'react';

export interface SidebarNavItemProps {
  /** If true, show checkbox indicator (checked style). */
  checked?: boolean;
  /** Checkbox/indicator change (for label with input). */
  onCheckedChange?: (checked: boolean) => void;
  /** Left icon (same line as label). */
  icon?: ReactNode;
  /** Label text. */
  label: string;
  /** Optional count badge on the right. */
  count?: number | string;
  /** Active/selected style. */
  active?: boolean;
  /** Render as link (href) or button (onClick). If neither, renders as div (for label wrapper). */
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

const indicatorClasses =
  'control__indicator !static !top-0 !left-0 !transform-none !transition-all !w-5 !h-5 !min-w-[20px] !min-h-[20px] flex-shrink-0';

export function SidebarNavItem({
  checked = false,
  onCheckedChange,
  icon,
  label,
  count,
  active,
  href,
  onClick,
  className = '',
  children,
}: SidebarNavItemProps) {
  const activeClass = active ? 'k-sidebar-item-active' : '';
  const baseClass = `k-sidebar-item group ${activeClass} ${className}`.trim();

  const content = (
    <>
      {onCheckedChange != null && (
        <>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="sr-only"
            aria-hidden
          />
          <div
            className={`${indicatorClasses} ${checked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}
          />
        </>
      )}
      {icon != null && <span className="flex-shrink-0 inline-flex items-center k-sidebar-icon">{icon}</span>}
      <span className="text-[11px] font-bold uppercase tracking-wider flex-1 min-w-0 truncate">{label}</span>
      {count != null && <span className="k-sidebar-count">{count}</span>}
      {children}
    </>
  );

  if (href != null) {
    return (
      <a href={href} className={baseClass}>
        {content}
      </a>
    );
  }
  if (onCheckedChange != null) {
    return <label className={baseClass}>{content}</label>;
  }
  if (onClick != null) {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left ${baseClass}`}>
        {content}
      </button>
    );
  }
  return <div className={baseClass}>{content}</div>;
}
