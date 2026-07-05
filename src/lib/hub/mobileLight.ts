/** Hub mobile light mode: read-only browsing, no visibility polling, desktop-only dashboards. */

export const HUB_VISIBILITY_REFRESH_MS = 10 * 60 * 1000;

let lastVisibilityRefreshAt = 0;

export function isHubMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 1023px)').matches;
}

export function shouldSkipHubVisibilityRefresh(): boolean {
  if (typeof window === 'undefined') return true;
  if (isHubMobileViewport()) return true;
  if (Date.now() - lastVisibilityRefreshAt < HUB_VISIBILITY_REFRESH_MS) return true;
  return false;
}

export function markHubVisibilityRefreshed(): void {
  lastVisibilityRefreshAt = Date.now();
}
