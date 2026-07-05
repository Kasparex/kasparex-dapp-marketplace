'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import {
  directoryListingToDApp,
  getDirectoryListings,
  importRemoteDirectoryListings,
  type DirectoryListing,
} from '@/lib/dapps/listingSubmissions';
import { pullAndMergeHubContent, onHubContentVisibilityRefresh } from '@/lib/hub/contentSync';

export function useDirectoryListings(submitterAddress?: string | null) {
  const [listings, setListings] = useState<DirectoryListing[]>([]);

  const refresh = useCallback(() => {
    setListings(getDirectoryListings(submitterAddress ?? undefined));
  }, [submitterAddress]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const remote = await pullAndMergeHubContent();
      if (!cancelled && remote?.dapps?.length) {
        importRemoteDirectoryListings(remote.dapps);
      }
      if (!cancelled) refresh();
    };

    void bootstrap();
    const onUpdate = () => refresh();
    window.addEventListener('dapp-listing-submissions-updated', onUpdate);
    const stopVisibility = onHubContentVisibilityRefresh(async () => {
      const remote = await pullAndMergeHubContent();
      if (remote?.dapps?.length) importRemoteDirectoryListings(remote.dapps);
      refresh();
    });
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
