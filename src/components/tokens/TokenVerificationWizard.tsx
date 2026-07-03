'use client';

import { useMemo, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { Alert } from '@/components/Alert';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKaspaMessage } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import {
  getTokenVerificationFlow,
  getListingNetworkLabel,
  tokenNetworkToListingNetwork,
  type TokenVerificationMethod,
} from '@/lib/tokens/listingNetwork';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

interface TokenVerificationWizardProps {
  listing: PublishedTokenListing;
  onVerified: (proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
  onClose: () => void;
}

function buildVerificationMessage(listing: PublishedTokenListing, address: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kasparex.com';
  return [
    'Kasparex Token Verification',
    `Listing: ${listing.symbol} (${listing.slug})`,
    `Contract: ${listing.contractAddress || 'n/a'}`,
    `Owner wallet: ${address}`,
    `Origin: ${origin}`,
    `Issued: ${new Date().toISOString()}`,
  ].join('\n');
}

export function TokenVerificationWizard({ listing, onVerified, onClose }: TokenVerificationWizardProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const network = listing.listingNetwork ?? tokenNetworkToListingNetwork(listing.network, listing.contractAddress);
  const flow = useMemo(() => getTokenVerificationFlow(network), [network]);

  const availableMethods = flow.methods.filter((m) => m.available);
  const [selectedMethod, setSelectedMethod] = useState<TokenVerificationMethod | null>(availableMethods[0] ?? null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletKind = selectedMethod?.walletKind ?? flow.walletKind;
  const kaspaReady = kaspaState.isConnected && Boolean(kaspaState.address);
  const evmReady = isEvmConnected && Boolean(evmAddress);
  const activeAddress = walletKind === 'evm' ? (evmAddress ?? '') : (kaspaState.address ?? '');
  const walletReady = walletKind === 'evm' ? evmReady : kaspaReady;

  const alreadyVerified = listing.status === 'verified';

  const handleVerify = async () => {
    setError(null);
    if (!selectedMethod) {
      setError('Select a verification method.');
      return;
    }
    if (!walletReady || !activeAddress) {
      setError(
        walletKind === 'evm'
          ? 'Connect the EVM wallet that deployed or owns the contract.'
          : 'Connect the Kaspa wallet that deployed this token.',
      );
      return;
    }

    setIsVerifying(true);
    try {
      const message = buildVerificationMessage(listing, activeAddress);
      let signature: string | undefined;

      if (walletKind === 'evm') {
        signature = await signMessageAsync({ message });
      } else {
        if (!kaspaState.provider) throw new Error('Kaspa wallet provider unavailable.');
        signature = await signKaspaMessage(kaspaState.provider as KaspaWalletProvider, message);
      }

      if (!signature) throw new Error('Signature was not provided.');

      await onVerified({ method: selectedMethod.id, walletAddress: activeAddress, signature });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <DAppSectionHeader title="Token verification" className="mb-1" />
            <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{flow.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#02abb8]">
              {getListingNetworkLabel(network)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          {alreadyVerified ? (
            <Alert type="success" title="Already verified">
              This listing is verified. The developer badge is active on its token page.
            </Alert>
          ) : (
            <>
              <p className="kx-body-sm">{flow.intro}</p>

              {availableMethods.length === 0 ? (
                <Alert type="info" title="Coming soon">
                  Verification for {getListingNetworkLabel(network)} is not available yet. Check back soon.
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    {flow.methods.map((method) => {
                      const isSelected = selectedMethod?.id === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          disabled={!method.available}
                          onClick={() => method.available && setSelectedMethod(method)}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-[#02abb8] bg-[#02abb8]/5 shadow-sm'
                              : 'border-zinc-200 bg-white hover:border-[#02abb8]/40 dark:border-zinc-800 dark:bg-zinc-900'
                          } ${method.available ? '' : 'cursor-not-allowed opacity-50'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{method.label}</span>
                            {!method.available ? (
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
                                Soon
                              </span>
                            ) : isSelected ? (
                              <span className="rounded-md bg-[#02abb8]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#02abb8]">
                                Selected
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{method.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {walletKind === 'evm' ? 'EVM wallet' : 'Kaspa wallet'}
                      </span>
                      <span
                        className={`font-semibold ${walletReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {walletReady ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                    {activeAddress ? (
                      <p className="mt-1 truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300" title={activeAddress}>
                        {activeAddress}
                      </p>
                    ) : null}
                  </div>

                  {error ? (
                    <Alert type="error" title="Verification error">
                      {error}
                    </Alert>
                  ) : null}

                  <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
                    Verifying rewards <span className="font-bold text-[#02abb8]">+{HUB_EARN_POINTS.tokenListingVerify} Hub Points</span> and activates the verified developer badge.
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 p-5 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="k-control-btn">
            {alreadyVerified ? 'Close' : 'Cancel'}
          </button>
          {!alreadyVerified && availableMethods.length > 0 ? (
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={isVerifying || !walletReady}
              className="k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? 'Verifying…' : 'Sign and verify'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
