'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DAppTab } from '@/components/dapps/layout/DAppTabs';
import { defaultDAppDetailTab } from '@/lib/dapps/buildDAppDetailTabs';

type DAppDetailNavContextValue = {
  currentTab: string;
  setTab: (tab: string) => void;
  tabs: readonly DAppTab<string>[];
  setTabs: (tabs: readonly DAppTab<string>[]) => void;
};

const DAppDetailNavContext = createContext<DAppDetailNavContextValue | null>(null);

export function DAppDetailNavProvider({
  dappSlug,
  initialTab,
  children,
}: {
  dappSlug: string;
  initialTab?: string;
  children: ReactNode;
}) {
  const [currentTab, setCurrentTab] = useState(
    () => initialTab ?? defaultDAppDetailTab(dappSlug),
  );
  const [tabs, setTabsState] = useState<readonly DAppTab<string>[]>([]);

  const setTab = useCallback((tab: string) => {
    setCurrentTab(tab);
  }, []);

  const setTabs = useCallback((next: readonly DAppTab<string>[]) => {
    setTabsState((prev) => {
      if (
        prev.length === next.length &&
        prev.every((t, i) => t.id === next[i]?.id && t.label === next[i]?.label)
      ) {
        // Still refresh when adornments/icons may have changed (e.g. comment count).
        const adornmentChanged = prev.some(
          (t, i) => t.rightAdornment !== next[i]?.rightAdornment,
        );
        if (!adornmentChanged) return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ currentTab, setTab, tabs, setTabs }),
    [currentTab, setTab, tabs, setTabs],
  );

  return (
    <DAppDetailNavContext.Provider value={value}>{children}</DAppDetailNavContext.Provider>
  );
}

export function useDAppDetailNav(): DAppDetailNavContextValue {
  const ctx = useContext(DAppDetailNavContext);
  if (!ctx) {
    throw new Error('useDAppDetailNav must be used within DAppDetailNavProvider');
  }
  return ctx;
}

/** Safe for sidebar when provider may be absent during loading. */
export function useDAppDetailNavOptional(): DAppDetailNavContextValue | null {
  return useContext(DAppDetailNavContext);
}
