'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DApp } from '@/lib/dapps';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';
import { getErrorMessage } from '@/lib/utils';
import { useDAppAccess } from '@/hooks/useDAppAccess';
import type { DAppGateReason } from '@/lib/dapps/access';
import { DAppIcon } from './DAppIcon';
import { DAppNetworkBadge } from './DAppNetworkBadge';

interface DAppWalletGateModalProps {
  dapp: DApp;
  isOpen: boolean;
  onClose: () => void;
  selectedNetwork?: 'all' | 'L1' | 'L2';
  isContractMissingOnNetwork?: boolean;
}

function gateTitle(reason: DAppGateReason): string {
  switch (reason) {
    case 'l1_wallet_required':
      return 'Wallet required';
    case 'filter_mismatch':
      return 'Network filter';
    case 'contract_missing':
      return 'Not available';
    default:
      return 'Connect to continue';
  }
}

function L1WalletOptions({ onConnected }: { onConnected?: () => void }) {
  const { connect } = useKaspaWallet();
  const [connecting, setConnecting] = useState<'kasware' | 'kastle' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detected = detectKaspaWallets();
  const isKasWareInstalled = detected.some((w) => w.id === 'kasware' && w.isInstalled);
  const isKastleInstalled = typeof window !== 'undefined' && !!(window as Window & { kastle?: unknown }).kastle;

  const handleConnect = async (provider: 'kasware' | 'kastle') => {
    setConnecting(provider);
    setError(null);
    try {
      await connect(provider, {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex dApps!',
          appName: 'Kasparex dApps',
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
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleConnect('kasware')}
        disabled={!isKasWareInstalled || connecting !== null}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isKasWareInstalled ? 'KasWare' : 'Install KasWare'}</span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {connecting === 'kasware' ? 'Connecting…' : 'L1'}
        </span>
      </button>
      <button
        type="button"
        onClick={() => void handleConnect('kastle')}
        disabled={!isKastleInstalled || connecting !== null}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isKastleInstalled ? 'Kastle' : 'Install Kastle'}</span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {connecting === 'kastle' ? 'Connecting…' : 'L1'}
        </span>
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

/** L1-only wallet gate modal. L2 connect/switch uses RainbowKit directly via useDAppWalletGate. */
export function DAppWalletGateModal({
  dapp,
  isOpen,
  onClose,
  selectedNetwork = 'all',
  isContractMissingOnNetwork = false,
}: DAppWalletGateModalProps) {
  const access = useDAppAccess({ dapp, selectedNetwork, isContractMissingOnNetwork });

  useEffect(() => {
    if (isOpen && access.isOpenable) {
      onClose();
    }
  }, [isOpen, access.isOpenable, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === 'undefined') return null;

  const { gateReason, message } = access;
  const showL1Connect = gateReason === 'l1_wallet_required';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dapp-wallet-gate-title"
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DAppIcon dAppName={dapp.name} category={dapp.category} size={40} className="rounded-lg shrink-0" />
            <div className="min-w-0">
              <div id="dapp-wallet-gate-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {gateTitle(gateReason)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{dapp.name}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>

          <div className="flex flex-col items-start gap-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Required network
            </div>
            <DAppNetworkBadge dapp={dapp} preferRequired size="md" />
          </div>

          {showL1Connect ? <L1WalletOptions onConnected={onClose} /> : null}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
