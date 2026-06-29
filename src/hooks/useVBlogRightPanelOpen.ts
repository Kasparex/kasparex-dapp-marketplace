'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kasparex-vblog-right-panel-open';

export function useVBlogRightPanelOpen(
  initial = true,
  articleOverride?: boolean,
): [boolean, (next: boolean) => void] {
  const resolvedInitial = articleOverride ?? initial;
  const [open, setOpenState] = useState(resolvedInitial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (articleOverride !== undefined) {
      setOpenState(articleOverride);
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === '0') setOpenState(false);
      else if (raw === '1') setOpenState(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [articleOverride]);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  return [hydrated ? open : resolvedInitial, setOpen];
}
