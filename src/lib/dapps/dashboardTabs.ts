export type DAppDashboardTab = 'overview' | 'listings' | 'create';

export function parseDAppDashboardTab(value: string | null): DAppDashboardTab {
  switch (value) {
    case 'listings':
      return 'listings';
    case 'create':
      return 'create';
    default:
      return 'overview';
  }
}

export function dAppDashboardTabHref(tab: DAppDashboardTab): string {
  return tab === 'overview' ? '/dapps/dashboard' : `/dapps/dashboard?tab=${tab}`;
}
