'use client';

import { useEffect, useState } from 'react';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';
import { requestKaspaProviders } from '@/lib/kaspa/mobileWallet';

/** Re-probe for injected Kaspa wallets (helps mobile in-app browsers). */
export function useKaspaProviderProbe() {
  const [installed, setInstalled] = useState(() =>
    typeof window === 'undefined' ? [] : detectKaspaWallets(),
  );

  useEffect(() => {
    const refresh = () => setInstalled(detectKaspaWallets());

    refresh();
    requestKaspaProviders();

    const onProvider = () => refresh();
    window.addEventListener('kaspa:provider', onProvider);
    const timer = window.setInterval(refresh, 1500);
    const stopTimer = window.setTimeout(() => window.clearInterval(timer), 8000);

    return () => {
      window.removeEventListener('kaspa:provider', onProvider);
      window.clearInterval(timer);
      window.clearTimeout(stopTimer);
    };
  }, []);

  const isInstalled = (id: string) => installed.some((w) => w.id === id && w.isInstalled);

  return { installed, isInstalled, refresh: () => setInstalled(detectKaspaWallets()) };
}
