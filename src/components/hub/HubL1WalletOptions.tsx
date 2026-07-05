'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getErrorMessage } from '@/lib/utils';
import { L1WalletConnectOptions } from '@/components/wallet/L1WalletConnectOptions';

export function HubL1WalletOptions({ onConnected }: { onConnected?: () => void }) {
  const { connect } = useKaspaWallet();
  const [connecting, setConnecting] = useState<'kasware' | 'kastle' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (provider: 'kasware' | 'kastle') => {
    setConnecting(provider);
    setError(null);
    try {
      await connect(provider, {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex!',
          appName: 'Kasparex',
        },
      });
      onConnected?.();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to connect to ${provider}`));
    } finally {
      setConnecting(null);
    }
  };

  return (
    <L1WalletConnectOptions onConnect={handleConnect} connecting={connecting} error={error} />
  );
}
