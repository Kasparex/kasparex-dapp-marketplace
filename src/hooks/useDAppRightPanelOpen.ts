'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kasparex-dapp-right-panel-open';

/** Persisted preference for DApp detail layout: whether the right column is visible. */
export function useDAppRightPanelOpen(initial = true): [boolean, (next: boolean) => void] {
  const [open, setOpenState] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === '0') setOpenState(false);
      else if (raw === '1') setOpenState(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  return [hydrated ? open : initial, setOpen];
}
