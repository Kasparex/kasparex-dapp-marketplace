'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import {
  directoryListingToDApp,
  getDirectoryListings,
  type DirectoryListing,
} from '@/lib/dapps/listingSubmissions';
import { bootstrapHubContent, onHubContentVisibilityRefresh } from '@/lib/hub/contentSync';

export function useDirectoryListings(submitterAddress?: string | null) {
  const [listings, setListings] = useState<DirectoryListing[]>([]);

  const refresh = useCallback(() => {
    setListings(getDirectoryListings(submitterAddress ?? undefined));
  }, [submitterAddress]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await bootstrapHubContent();
      if (!cancelled) refresh();
    };

    void bootstrap();
    const onUpdate = () => refresh();
    window.addEventListener('dapp-listing-submissions-updated', onUpdate);
    const stopVisibility = onHubContentVisibilityRefresh(() => refresh());
    return () => {
      cancelled = true;
      window.removeEventListener('dapp-listing-submissions-updated', onUpdate);
      stopVisibility();
    };
  }, [refresh]);

  const activeDirectoryDApps = useMemo((): DApp[] => {
    return listings
      .filter((l) => l.status === 'active')
      .map(directoryListingToDApp);
  }, [listings]);

  return { listings, activeDirectoryDApps, refresh };
}
