'use client';

import { createContext, useContext } from 'react';

const RequestHostContext = createContext<string | null>(null);

export function useRequestHost(): string | null {
  return useContext(RequestHostContext);
}

export function CanonicalNavProvider({
  host,
  children,
}: {
  host: string | null;
  children: React.ReactNode;
}) {
  return <RequestHostContext.Provider value={host}>{children}</RequestHostContext.Provider>;
}
