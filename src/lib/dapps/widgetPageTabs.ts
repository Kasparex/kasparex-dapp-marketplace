import type { DAppTabDef } from '@/lib/dapps/modules/types';

/** Page-level tabs promoted from in-widget navigation (covenant dApps, etc.). */
export const WIDGET_PAGE_TABS: Record<string, readonly DAppTabDef[]> = {
  lockbox: [
    { id: 'create', label: 'Create lock' },
    { id: 'vaults', label: 'Vaults' },
    { id: 'metadata', label: 'Metadata' },
  ],
  'covenant-split': [
    { id: 'create', label: 'Create split' },
    { id: 'splits', label: 'Splits' },
    { id: 'metadata', label: 'Metadata' },
  ],
  'covenant-milestone': [
    { id: 'create', label: 'New deal' },
    { id: 'deals', label: 'Deals' },
    { id: 'metadata', label: 'Metadata' },
  ],
  'covenant-crowdfund': [
    { id: 'browse', label: 'Campaigns' },
    { id: 'create', label: 'Launch' },
    { id: 'metadata', label: 'Metadata' },
  ],
  'covenant-voucher': [
    { id: 'create', label: 'Mint voucher' },
    { id: 'claim', label: 'Redeem' },
    { id: 'metadata', label: 'Metadata' },
  ],
  'kaspa-capsule': [
    { id: 'create', label: 'Leave message' },
    { id: 'messages', label: 'Messages' },
    { id: 'metadata', label: 'Metadata' },
  ],
};

export function getWidgetPageTabs(slug?: string): readonly DAppTabDef[] {
  if (!slug) return [];
  return WIDGET_PAGE_TABS[slug] ?? [];
}

export function hasWidgetMetadataTab(slug?: string): boolean {
  return getWidgetPageTabs(slug).some((t) => t.id === 'metadata');
}

/** Tabs where the calculation breakdown sidebar should be visible. */
export function isWidgetCalculationTab(tabId: string, slug?: string): boolean {
  const widgetTabs = getWidgetPageTabs(slug);
  if (widgetTabs.length === 0) return tabId === 'widget';
  return tabId === 'create';
}
