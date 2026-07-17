'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react';

export type DAppWidgetRailSlots = {
  actions: ReactNode;
  /**
   * Status / validation / one-time notices rendered in Calculation Breakdown
   * directly below the primary action button (after `actions`, before Flow Progress).
   */
  alerts: ReactNode;
  /** Optional quote extras above the primary action. */
  extraBreakdown: ReactNode;
  /** Optional Flow Progress override for the calculation sidebar. */
  flowProgress: ReactNode;
};

const EMPTY_SLOTS: DAppWidgetRailSlots = {
  actions: null,
  alerts: null,
  extraBreakdown: null,
  flowProgress: null,
};

type DAppWidgetActionRailContextValue = {
  slots: DAppWidgetRailSlots;
  setActions: (node: ReactNode) => void;
  setAlerts: (node: ReactNode) => void;
  setExtraBreakdown: (node: ReactNode) => void;
  setFlowProgress: (node: ReactNode) => void;
};

const DAppWidgetActionRailContext = createContext<DAppWidgetActionRailContextValue | null>(null);

export function DAppWidgetActionRailProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<DAppWidgetRailSlots>(EMPTY_SLOTS);

  const setSlot = useCallback((key: keyof DAppWidgetRailSlots, node: ReactNode) => {
    setSlots((prev) => (prev[key] === node ? prev : { ...prev, [key]: node }));
  }, []);

  const value = useMemo(
    (): DAppWidgetActionRailContextValue => ({
      slots,
      setActions: (node) => setSlot('actions', node),
      setAlerts: (node) => setSlot('alerts', node),
      setExtraBreakdown: (node) => setSlot('extraBreakdown', node),
      setFlowProgress: (node) => setSlot('flowProgress', node),
    }),
    [slots, setSlot],
  );

  return <DAppWidgetActionRailContext.Provider value={value}>{children}</DAppWidgetActionRailContext.Provider>;
}

export function useDAppWidgetActionRail() {
  const ctx = useContext(DAppWidgetActionRailContext);
  if (!ctx) {
    return {
      slots: EMPTY_SLOTS,
      setActions: () => {},
      setAlerts: () => {},
      setExtraBreakdown: () => {},
      setFlowProgress: () => {},
    };
  }
  return ctx;
}

export function useRegisterDAppWidgetRailSlot(
  slot: keyof DAppWidgetRailSlots,
  node: ReactNode,
  deps: DependencyList,
) {
  const rail = useDAppWidgetActionRail();

  useEffect(() => {
    const setter =
      slot === 'actions'
        ? rail.setActions
        : slot === 'alerts'
          ? rail.setAlerts
          : slot === 'flowProgress'
            ? rail.setFlowProgress
            : rail.setExtraBreakdown;
    setter(node);
    return () => setter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function hasDAppWidgetRailContent(slots: DAppWidgetRailSlots): boolean {
  return Boolean(slots.actions || slots.alerts || slots.extraBreakdown || slots.flowProgress);
}
