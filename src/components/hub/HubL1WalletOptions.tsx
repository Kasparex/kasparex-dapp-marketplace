'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getErrorMessage } from '@/lib/utils';
import { L1WalletConnectOptions } from '@/components/wallet/L1WalletConnectOptions';
import type { L1WalletProviderId } from '@/components/wallet/L1WalletLogo';

export function HubL1WalletOptions({ onConnected }: { onConnected?: () => void }) {
  const { connect } = useKaspaWallet();
  const [connecting, setConnecting] = useState<L1WalletProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (
    provider: L1WalletProviderId,
    options?: { onPairingUri?: (uri: string) => void },
  ) => {
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
        onPairingUri: options?.onPairingUri,
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
