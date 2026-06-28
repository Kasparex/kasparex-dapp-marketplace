'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ChroniclesUnlockModal } from '@/components/chronicles/vault/ChroniclesUnlockModal';
import type { ChroniclesContentId } from '@/lib/chronicles/entitlements/types';

type UnlockContextValue = {
  openUnlock: (contentId: ChroniclesContentId) => void;
  closeUnlock: () => void;
};

const ChroniclesUnlockContext = createContext<UnlockContextValue | null>(null);

export function ChroniclesUnlockProvider({ children }: { children: ReactNode }) {
  const [contentId, setContentId] = useState<ChroniclesContentId | null>(null);

  const openUnlock = useCallback((id: ChroniclesContentId) => setContentId(id), []);
  const closeUnlock = useCallback(() => setContentId(null), []);

  const value = useMemo(() => ({ openUnlock, closeUnlock }), [openUnlock, closeUnlock]);

  return (
    <ChroniclesUnlockContext.Provider value={value}>
      {children}
      <ChroniclesUnlockModal contentId={contentId} isOpen={contentId != null} onClose={closeUnlock} />
    </ChroniclesUnlockContext.Provider>
  );
}

export function useChroniclesUnlock() {
  const ctx = useContext(ChroniclesUnlockContext);
  if (!ctx) {
    throw new Error('useChroniclesUnlock must be used within ChroniclesUnlockProvider');
  }
  return ctx;
}
