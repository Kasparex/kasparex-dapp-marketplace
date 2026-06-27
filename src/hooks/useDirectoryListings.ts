'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import {
  directoryListingToDApp,
  getDirectoryListings,
  type DirectoryListing,
} from '@/lib/dapps/listingSubmissions';

export function useDirectoryListings(submitterAddress?: string) {
  const [listings, setListings] = useState<DirectoryListing[]>([]);

  const refresh = useCallback(() => {
    setListings(getDirectoryListings(submitterAddress));
  }, [submitterAddress]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener('dapp-listing-submissions-updated', onUpdate);
    return () => window.removeEventListener('dapp-listing-submissions-updated', onUpdate);
  }, [refresh]);

  const activeDirectoryDApps = useMemo((): DApp[] => {
    return listings
      .filter((l) => l.status === 'active')
      .map(directoryListingToDApp);
  }, [listings]);

  return { listings, activeDirectoryDApps, refresh };
}
