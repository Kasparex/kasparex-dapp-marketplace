export type ChroniclesCenterTab = 'overview' | 'submissions' | 'create';

export function parseChroniclesCenterTab(value: string | null): ChroniclesCenterTab {
  switch (value) {
    case 'submissions':
      return 'submissions';
    case 'create':
      return 'create';
    default:
      return 'overview';
  }
}

export function chroniclesCenterTabHref(tab: ChroniclesCenterTab): string {
  return tab === 'overview' ? '/chronicles/center' : `/chronicles/center?tab=${tab}`;
}
