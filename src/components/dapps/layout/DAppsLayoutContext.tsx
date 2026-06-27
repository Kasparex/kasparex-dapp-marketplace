'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type DAppsLayoutDensity = {
  rightPanelOpen: boolean;
};

const DAppsLayoutContext = createContext<DAppsLayoutDensity | null>(null);

export function DAppsLayoutProvider(props: DAppsLayoutDensity & { children: ReactNode }) {
  const { children, ...density } = props;
  return <DAppsLayoutContext.Provider value={density}>{children}</DAppsLayoutContext.Provider>;
}

export function useDAppsLayoutDensity(): DAppsLayoutDensity {
  const ctx = useContext(DAppsLayoutContext);
  return ctx ?? { rightPanelOpen: true };
}

/** Constrains tab content width when the right panel is hidden (matches Comments module margins). */
export function DAppsMainContent({ children }: { children: ReactNode }) {
  const { rightPanelOpen } = useDAppsLayoutDensity();
  if (rightPanelOpen) return <>{children}</>;
  return <div className="mx-auto w-full max-w-4xl px-2 sm:px-4">{children}</div>;
}
