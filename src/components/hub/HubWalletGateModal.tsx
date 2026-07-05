'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';
import { HubL1WalletOptions } from './HubL1WalletOptions';
import { HubNetworkBadge } from './HubNetworkBadge';
import type { HubWalletGateModalState } from '@/hooks/useHubWalletGate';

interface HubWalletGateModalProps extends HubWalletGateModalState {
  isOpen: boolean;
  onClose: () => void;
  icon?: ReactNode;
}

export function HubWalletGateModal({
  isOpen,
  onClose,
  title,
  name,
  message,
  networkBadge,
  showL1Connect,
  showEvmConnect,
  icon,
}: HubWalletGateModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="kx-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="kx-modal-panel relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-wallet-gate-title"
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon ? <div className="shrink-0">{icon}</div> : null}
            <div className="min-w-0">
              <div id="hub-wallet-gate-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {title}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{name}</div>
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
            <HubNetworkBadge badge={networkBadge} size="md" />
          </div>

          {showL1Connect ? <HubL1WalletOptions onConnected={onClose} /> : null}

          {showEvmConnect ? (
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <button
                  type="button"
                  disabled={!mounted}
                  onClick={() => openConnectModal?.()}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Connect EVM wallet
                </button>
              )}
            </ConnectButton.Custom>
          ) : null}

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
