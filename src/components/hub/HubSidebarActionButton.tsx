'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { HUB_SIDEBAR_BTN_ICON, HUB_SIDEBAR_BTN_ICON_ACTIVE } from '@/lib/hub/hubLayout';

export function HubSidebarActionButton(props: {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  external?: boolean;
}) {
  const { href, label, icon, active = false, external = false } = props;
  const className = `k-control-btn w-full justify-center gap-2 ${active ? 'hub-sidebar-action-active' : ''}`;
  const iconClass = active ? HUB_SIDEBAR_BTN_ICON_ACTIVE : HUB_SIDEBAR_BTN_ICON;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <span className={iconClass}>{icon}</span>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <span className={iconClass}>{icon}</span>
      {label}
    </Link>
  );
}
