'use client';

import type { MouseEventHandler, ReactNode } from 'react';

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
  /** Anchor-only: e.g. smooth in-page scroll with preventDefault. */
  onLinkClick?: MouseEventHandler<HTMLAnchorElement>;
  /** When `href` is set, open in a new tab (sets target + rel). */
  external?: boolean;
  /** Button-only: in-page action (no `href`). */
  onClick?: () => void;
  className?: string;
  /** Override default label typography (e.g. Chronicles sidebar). */
  labelClassName?: string;
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
  onLinkClick,
  external,
  onClick,
  className = '',
  labelClassName,
  children,
}: SidebarNavItemProps) {
  const activeClass = active ? 'k-sidebar-item-active' : '';
  const baseClass = `k-sidebar-item group ${activeClass} ${className}`.trim();
  const labelCn =
    labelClassName ??
    'text-[13px] font-medium text-zinc-700 dark:text-zinc-200 flex-1 min-w-0 truncate leading-tight';

  const content = (
    <>
      {icon != null && <span className="flex-shrink-0 inline-flex items-center justify-center k-sidebar-icon">{icon}</span>}
      <span className={labelCn}>{label}</span>
      {count != null && <span className="k-sidebar-count">{count}</span>}
      {children}
    </>
  );

  if (href != null) {
    return (
      <a
        href={href}
        className={baseClass}
        onClick={onLinkClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
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
