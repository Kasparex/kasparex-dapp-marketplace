'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { DApp } from '@/lib/dapps';

type DAppDetailContextValue = {
  dapp: DApp;
  mergedDApp: DApp;
  contractAddress: string;
};

const DAppDetailContext = createContext<DAppDetailContextValue | null>(null);

export function DAppDetailProvider({
  dapp,
  mergedDApp,
  contractAddress,
  children,
}: DAppDetailContextValue & { children: ReactNode }) {
  return (
    <DAppDetailContext.Provider value={{ dapp, mergedDApp, contractAddress }}>
      {children}
    </DAppDetailContext.Provider>
  );
}

export function useDAppDetailContext(): DAppDetailContextValue | null {
  return useContext(DAppDetailContext);
}
