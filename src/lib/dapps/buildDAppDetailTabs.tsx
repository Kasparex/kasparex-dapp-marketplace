import { getDAppNetworkType, type DApp } from '@/lib/dapps';
import type { DAppTab } from '@/components/dapps/layout/DAppTabs';
import { getWidgetPageTabs } from '@/lib/dapps/widgetPageTabs';
import {
  IconDAppWidget,
  IconOverview,
  IconComments,
  IconRevenueTree,
  IconMetadata,
  IconWidgetCreate,
  IconWidgetList,
  IconWidgetBrowse,
  IconHowItWorks,
} from '@/components/dapps/icons/DAppTabIcons';
import type { ReactNode } from 'react';

type BuildTabsOptions = {
  dapp: DApp;
  commentsCount: number;
  commentsBadge: ReactNode;
  labelOverrides?: Record<string, string>;
  includeOverview?: boolean;
  overviewLabel?: string;
};

function iconForWidgetPageTab(tabId: string) {
  switch (tabId) {
    case 'create':
    case 'launch':
    case 'mint':
      return <IconWidgetCreate />;
    case 'browse':
      return <IconWidgetBrowse />;
    case 'vaults':
    case 'splits':
    case 'deals':
    case 'claim':
      return <IconWidgetList />;
    case 'metadata':
      return <IconMetadata />;
    case 'about':
      return <IconHowItWorks />;
    default:
      return <IconDAppWidget />;
  }
}

export function dappParticipatesInRevenueTree(dapp: DApp): boolean {
  return getDAppNetworkType(dapp) === 'L2';
}

export function buildDAppDetailTabs({
  dapp,
  commentsCount,
  commentsBadge,
  labelOverrides = {},
  includeOverview = false,
  overviewLabel = 'Overview',
}: BuildTabsOptions): readonly DAppTab<string>[] {
  const widgetTabs = getWidgetPageTabs(dapp.slug);
  const tabs: DAppTab<string>[] = [];

  if (includeOverview) {
    tabs.push({ id: 'overview', label: overviewLabel, icon: <IconDAppWidget /> });
  }

  if (widgetTabs.length > 0) {
    for (const wt of widgetTabs) {
      tabs.push({
        id: wt.id,
        label: labelOverrides[wt.id] ?? wt.label,
        icon: wt.icon ?? iconForWidgetPageTab(wt.id),
        rightAdornment: wt.rightAdornment,
      });
    }
  } else {
    tabs.push({ id: 'widget', label: 'DApp', icon: <IconDAppWidget /> });
  }

  tabs.push({ id: 'descriptions', label: 'Description', icon: <IconOverview /> });

  if (dappParticipatesInRevenueTree(dapp)) {
    tabs.push({ id: 'revenue-tree', label: 'Revenue Tree', icon: <IconRevenueTree /> });
  }

  tabs.push({
    id: 'comments',
    label: 'Comments',
    icon: <IconComments />,
    rightAdornment: commentsCount > 0 ? commentsBadge : undefined,
  });

  return tabs;
}

export function isWidgetPageTab(tabId: string, slug?: string): boolean {
  const widgetTabs = getWidgetPageTabs(slug);
  if (widgetTabs.length === 0) return tabId === 'widget';
  return widgetTabs.some((t) => t.id === tabId);
}

export function defaultDAppDetailTab(slug?: string): string {
  const widgetTabs = getWidgetPageTabs(slug);
  if (widgetTabs.length > 0) return widgetTabs[0].id;
  return 'widget';
}
