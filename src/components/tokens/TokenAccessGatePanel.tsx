'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { Alert } from '@/components/Alert';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import { canUseProgrammableUtility, resolveProgrammableCovenantId } from '@/lib/programmable/eligibility';
import { fetchKascovCovenant } from '@/lib/programmable/kascovClient';
import { formatKcc20Sompi } from '@/lib/tokens/kcc20Lookup';
import { tokenHasModule } from '@/lib/tokens/modules';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokenAccessGatePanel({ token }: { token: Token }) {
  const { state: kaspaState } = useKaspaWallet();
  const [checking, setChecking] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visible =
    canUseProgrammableUtility(token) && tokenHasModule(token.paidModuleIds, 'access_gate');
  const config = token.modulesConfig?.accessGate;
  const covenantId = resolveProgrammableCovenantId(token);
  const networkId = token.onChainSnapshot?.networkId ?? DEFAULT_PROGRAMMABLE_NETWORK;

  const checkAccess = useCallback(async () => {
    if (!covenantId) {
      setMessage('No covenant id linked to this token.');
      setPassed(false);
      return;
    }
    setChecking(true);
    setMessage(null);
    try {
      const detail = await fetchKascovCovenant(covenantId, networkId);
      if (!detail) {
        setMessage('Could not read covenant state from kascov.');
        setPassed(false);
        return;
      }
      const liveSompi = BigInt(detail.live_value ?? 0);
      const minRequired = config?.minBalanceSompi ? BigInt(config.minBalanceSompi) : BigInt(0);

      if (config?.holderOnly && liveSompi > BigInt(0)) {
        setPassed(true);
        setMessage('Holder check passed (covenant has live value on-chain).');
        return;
      }
      if (minRequired > BigInt(0) && liveSompi >= minRequired) {
        setPassed(true);
        setMessage(`Balance check passed (${formatKcc20Sompi(String(liveSompi), token.decimals ?? 8)} KAS live).`);
        return;
      }
      setPassed(false);
      setMessage(
        config?.deniedMessage ??
          'Access denied. Connect a wallet holding this covenant token or meet the minimum balance.',
      );
    } catch {
      setPassed(false);
      setMessage('Access check failed. Try again later.');
    } finally {
      setChecking(false);
    }
  }, [config, covenantId, networkId, token.decimals]);

  if (!visible) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <DAppSectionHeader title="Access gate" className="mb-1" />
      <p className="kx-body-sm">
        Gated utility for covenant token holders. v1 uses read-only kascov covenant state; wallet-native
        holder proofs arrive with KCC-20 wallet APIs.
      </p>

      {config?.minBalanceSompi ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Minimum live covenant value: {formatKcc20Sompi(config.minBalanceSompi, token.decimals ?? 8)} KAS
        </p>
      ) : null}
      {config?.holderOnly ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Any live covenant holder may pass.</p>
      ) : null}

      {!kaspaState.isConnected ? (
        <Alert type="info">Connect your Kaspa wallet to run the holder check.</Alert>
      ) : (
        <button
          type="button"
          onClick={() => void checkAccess()}
          disabled={checking}
          className="k-control-btn text-sm disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Check holder access'}
        </button>
      )}

      {message ? (
        <Alert type={passed ? 'success' : 'warning'}>{message}</Alert>
      ) : null}

      {passed && config?.unlockUrl ? (
        <Link
          href={config.unlockUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex k-control-btn text-sm font-semibold"
          style={{ color: TOKENS_ACCENT }}
        >
          Open unlocked content
        </Link>
      ) : null}
    </div>
  );
}
