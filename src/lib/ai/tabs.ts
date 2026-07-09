import type { AiListingTab } from './types';

export const AI_LISTING_TABS: { id: AiListingTab; label: string }[] = [
  { id: 'all', label: 'All Agents' },
  { id: 'my-agents', label: 'My Agents' },
  { id: 'content-creation', label: 'Content Creation' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'research', label: 'Research' },
  { id: 'finance', label: 'Finance' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'utilities', label: 'Utilities' },
];

export const AI_TAB_LABELS: Record<AiListingTab, string> = Object.fromEntries(
  AI_LISTING_TABS.map((t) => [t.id, t.label]),
) as Record<AiListingTab, string>;
