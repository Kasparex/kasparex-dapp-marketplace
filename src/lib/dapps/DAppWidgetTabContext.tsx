'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react';

type LabelRegistrar = (tabId: string, label: string | null) => void;

const WidgetTabLabelRegistryContext = createContext<LabelRegistrar | null>(null);
const WidgetTabLabelOverridesContext = createContext<Record<string, string>>({});

/** Holds dynamic tab label overrides from widgets (e.g. Vaults (6)). */
export function DAppWidgetTabLabelProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const register = useCallback<LabelRegistrar>((tabId, label) => {
    setOverrides((prev) => {
      if (label == null) {
        if (!(tabId in prev)) return prev;
        const next = { ...prev };
        delete next[tabId];
        return next;
      }
      if (prev[tabId] === label) return prev;
      return { ...prev, [tabId]: label };
    });
  }, []);

  return (
    <WidgetTabLabelRegistryContext.Provider value={register}>
      <WidgetTabLabelOverridesContext.Provider value={overrides}>{children}</WidgetTabLabelOverridesContext.Provider>
    </WidgetTabLabelRegistryContext.Provider>
  );
}

export function useWidgetTabLabelOverrides(): Record<string, string> {
  return useContext(WidgetTabLabelOverridesContext);
}

export function useRegisterWidgetTabLabel(tabId: string, label: string, deps: DependencyList) {
  const register = useContext(WidgetTabLabelRegistryContext);
  useEffect(() => {
    if (!register) return;
    register(tabId, label);
    return () => register(tabId, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, label, register, ...deps]);
}

const WidgetSectionContext = createContext<string | null>(null);
const WidgetNavigateContext = createContext<((tab: string) => void) | null>(null);

export function DAppWidgetSectionProvider({
  section,
  onNavigate,
  children,
}: {
  section: string | null;
  onNavigate?: (tab: string) => void;
  children: ReactNode;
}) {
  return (
    <WidgetNavigateContext.Provider value={onNavigate ?? null}>
      <WidgetSectionContext.Provider value={section}>{children}</WidgetSectionContext.Provider>
    </WidgetNavigateContext.Provider>
  );
}

/** Active page tab section for in-widget routing (create, vaults, metadata, etc.). */
export function useDAppWidgetSection(fallback = 'create'): string {
  return useContext(WidgetSectionContext) ?? fallback;
}

export function useNavigateDAppWidgetTab(): (tab: string) => void {
  const navigate = useContext(WidgetNavigateContext);
  return navigate ?? (() => {});
}
