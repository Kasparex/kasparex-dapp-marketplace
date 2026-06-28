'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kasparex-vblog-right-panel-open';

export function useVBlogRightPanelOpen(initial = true): [boolean, (next: boolean) => void] {
  const [open, setOpenState] = useState(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === '0') setOpenState(false);
      else if (raw === '1') setOpenState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  return [open, setOpen];
}
