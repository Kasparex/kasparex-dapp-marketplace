export type ChroniclesCenterTab = 'overview' | 'listings' | 'create';

export function parseChroniclesCenterTab(value: string | null): ChroniclesCenterTab {
  switch (value) {
    case 'listings':
    case 'submissions':
      return 'listings';
    case 'create':
      return 'create';
    default:
      return 'overview';
  }
}

export function chroniclesCenterTabHref(tab: ChroniclesCenterTab): string {
  return tab === 'overview' ? '/chronicles/center' : `/chronicles/center?tab=${tab}`;
}
