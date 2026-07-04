'use client';

import { useMemo, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { Alert } from '@/components/Alert';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKaspaMessage } from '@/lib/kaspa/wallet';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { getListingNetworkLabel, tokenNetworkToListingNetwork } from '@/lib/tokens/listingNetwork';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

export type TokenVerificationMode = 'deployer' | 'assign';

interface TokenVerificationWizardProps {
  listing: PublishedTokenListing;
  mode: TokenVerificationMode;
  onComplete: (proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
  onClose: () => void;
}

function buildVerificationMessage(listing: PublishedTokenListing, address: string, mode: TokenVerificationMode): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kasparex.com';
  const action = mode === 'deployer' ? 'Deployer ownership verification' : 'Assign wallet to listed token';
  const covenantId =
    listing.onChainSnapshot?.covenantId ??
    (listing.listingNetwork === 'kcc20' ? listing.contractAddress : undefined);
  return [
    `Kasparex Token ${action}`,
    `Listing: ${listing.symbol} (${listing.slug})`,
    `Contract: ${listing.contractAddress || listing.onChainSnapshot?.contractAddress || 'n/a'}`,
    covenantId ? `Covenant: ${covenantId}` : null,
    `Wallet: ${address}`,
    `Origin: ${origin}`,
    `Issued: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function addressesMatch(a: string, b: string): boolean {
  try {
    return normalizeKaspaAddress(a).toLowerCase() === normalizeKaspaAddress(b).toLowerCase();
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

export function TokenVerificationWizard({ listing, mode, onComplete, onClose }: TokenVerificationWizardProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const network = listing.listingNetwork ?? tokenNetworkToListingNetwork(listing.network, listing.contractAddress);
  const isKrc20 = network === 'krc20';
  const isKcc20 = network === 'kcc20';
  const isL2 = network === 'l2_kasplex' || network === 'l2_igra';

  const kaspaReady = kaspaState.isConnected && Boolean(kaspaState.address);
  const evmReady = isEvmConnected && Boolean(evmAddress);
  const activeKaspa = kaspaState.address ?? '';
  const activeEvm = evmAddress ?? '';

  const expectedDeployer =
    listing.deployerAddress ??
    listing.onChainSnapshot?.deployer ??
    listing.onChainSnapshot?.owner;

  const deployerMismatch = useMemo(() => {
    if (mode !== 'deployer' || !expectedDeployer) return null;
    if (isKrc20 || isKcc20 || network === 'kaspa_l1') {
      if (!kaspaReady) return null;
      return addressesMatch(activeKaspa, expectedDeployer) ? null : expectedDeployer;
    }
    if (isL2) {
      if (!evmReady) return null;
      return activeEvm.toLowerCase() === expectedDeployer.toLowerCase() ? null : expectedDeployer;
    }
    return null;
  }, [mode, expectedDeployer, isKrc20, isKcc20, isL2, network, kaspaReady, evmReady, activeKaspa, activeEvm]);

  const l2NoOwner = mode === 'deployer' && isL2 && listing.assetKind === 'real' && !expectedDeployer;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyDeployerVerified = listing.ownership === 'deployer_verified';
  const alreadyWalletAssigned = listing.ownership === 'wallet_assigned' && mode === 'assign';

  const title =
    mode === 'deployer' ? 'Verify with Deployer Wallet' : 'Assign Wallet Address to Listed Token';

  const intro =
    mode === 'deployer'
      ? isKcc20
        ? 'Connect and sign with the Kaspa wallet that controls this KCC-20 covenant. Your address should match the project controller wallet.'
        : isKrc20
        ? 'Connect and sign with the Kaspa wallet that deployed this KRC-20 token. Your address must match the on-chain deployer.'
        : isL2
          ? 'Connect and sign with the EVM wallet that owns this contract. Your address must match the on-chain owner().'
          : 'Sign with the wallet that deployed this token.'
      : isL2
        ? 'Link your EVM wallet to this L2 token page. This does not prove deployer ownership and will not grant the verified developer badge.'
        : 'Link your Kaspa L1 wallet to this token page. This does not prove deployer ownership and will not grant the verified developer badge.';

  const handleSubmit = async () => {
    setError(null);

    if (l2NoOwner) {
      setError('This contract has no readable owner(). Use Assign Wallet instead.');
      return;
    }

    setIsSubmitting(true);
    try {
      let walletAddress = '';
      let signature: string | undefined;

      if (mode === 'deployer') {
        if (isL2) {
          if (!evmReady) {
            setError('Connect the EVM wallet that owns this contract.');
            return;
          }
          if (deployerMismatch) {
            setError('Connected wallet is not the on-chain owner. Switch to the owner wallet.');
            return;
          }
          walletAddress = activeEvm;
          const message = buildVerificationMessage(listing, walletAddress, mode);
          signature = await signMessageAsync({ message });
        } else {
          if (!kaspaReady || !kaspaState.provider) {
            setError('Connect the Kaspa wallet that deployed this token.');
            return;
          }
          if (deployerMismatch) {
            setError('Connected wallet is not the on-chain deployer. Switch to the deployer wallet.');
            return;
          }
          walletAddress = activeKaspa;
          const message = buildVerificationMessage(listing, walletAddress, mode);
          signature = await signKaspaMessage(kaspaState.provider as KaspaWalletProvider, message);
        }
      } else {
        // Assign wallet: Kaspa L1 tokens (KRC-20 / Kaspa L1 / KCC-20) use the Kaspa
        // wallet connector; only EVM L2 tokens use the EVM connector.
        if (isL2) {
          if (!evmReady) {
            setError('Connect your EVM wallet to assign this L2 token.');
            return;
          }
          walletAddress = activeEvm;
          const message = buildVerificationMessage(listing, walletAddress, mode);
          signature = await signMessageAsync({ message });
        } else {
          if (!kaspaReady || !kaspaState.provider) {
            setError('Connect your Kaspa L1 wallet to assign this token.');
            return;
          }
          walletAddress = activeKaspa;
          const message = buildVerificationMessage(listing, walletAddress, mode);
          signature = await signKaspaMessage(kaspaState.provider as KaspaWalletProvider, message);
        }
      }

      if (!signature) {
        setError('Signature was not provided.');
        return;
      }

      await onComplete({
        method: mode === 'deployer' ? 'deployer_signature' : 'wallet_assign',
        walletAddress,
        signature,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <DAppSectionHeader title={mode === 'deployer' ? 'Deployer verification' : 'Wallet assignment'} className="mb-1" />
            <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#02abb8]">
              {getListingNetworkLabel(network)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          {alreadyDeployerVerified && mode === 'deployer' ? (
            <Alert type="success" title="Already verified">
              Deployer ownership is verified. This listing appears under Developer-Listed Token Projects (UaaS).
            </Alert>
          ) : alreadyWalletAssigned ? (
            <Alert type="success" title="Wallet assigned">
              A wallet is already linked to this listing.
            </Alert>
          ) : (
            <>
              <p className="kx-body-sm">{intro}</p>

              {expectedDeployer && mode === 'deployer' ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {isL2 ? 'On-chain owner' : 'On-chain deployer'}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-zinc-700 dark:text-zinc-300" title={expectedDeployer}>
                    {expectedDeployer}
                  </p>
                </div>
              ) : null}

              {deployerMismatch ? (
                <Alert type="error" title="Wallet mismatch">
                  Your connected wallet does not match the on-chain {isL2 ? 'owner' : 'deployer'}. Connect the correct wallet to verify.
                </Alert>
              ) : null}

              {l2NoOwner ? (
                <Alert type="info" title="Owner not available">
                  This contract does not expose owner(). Automatic deployer verification is unavailable. You can still assign a wallet to this listing.
                </Alert>
              ) : null}

              {error ? (
                <Alert type="error" title="Error">
                  {error}
                </Alert>
              ) : null}

              {mode === 'deployer' ? (
                <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
                  Success awards <span className="font-bold text-[#02abb8]">+{HUB_EARN_POINTS.tokenListingVerify} Hub Points</span> and lists under Developer-Listed Token Projects (UaaS).
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  Assigning a wallet links it to your page but keeps the listing under Community Collaboration Tokens without a verified badge.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 p-5 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="k-control-btn">
            {alreadyDeployerVerified || alreadyWalletAssigned ? 'Close' : 'Cancel'}
          </button>
          {!alreadyDeployerVerified && !alreadyWalletAssigned && !l2NoOwner ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || Boolean(deployerMismatch)}
              className="k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Signing…' : mode === 'deployer' ? 'Sign and verify' : 'Sign and assign'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
