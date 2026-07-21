export type ChroniclesCenterTab = 'create' | 'listings';

export function parseChroniclesCenterTab(value: string | null): ChroniclesCenterTab {
  switch (value) {
    case 'listings':
    case 'submissions':
      return 'listings';
    case 'overview':
      return 'create';
    case 'create':
    default:
      return 'create';
  }
}

export function chroniclesCenterTabHref(tab: ChroniclesCenterTab): string {
  return tab === 'create' ? '/chronicles/center' : `/chronicles/center?tab=${tab}`;
}
