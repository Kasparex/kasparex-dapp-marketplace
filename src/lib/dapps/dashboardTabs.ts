export type DAppDashboardTab = 'create' | 'listings';

export function parseDAppDashboardTab(value: string | null): DAppDashboardTab {
  switch (value) {
    case 'listings':
      return 'listings';
    case 'overview':
      return 'create';
    case 'create':
    default:
      return 'create';
  }
}

export function dAppDashboardTabHref(tab: DAppDashboardTab): string {
  return tab === 'create' ? '/dapps/dashboard' : `/dapps/dashboard?tab=${tab}`;
}
