'use client';

import { useMemo, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Alert } from '@/components/Alert';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getWalletProvider, signKaspaMessage } from '@/lib/kaspa/wallet';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type { TokenListingNetwork } from '@/lib/tokens/listingNetwork';
import { getListingNetworkLabel } from '@/lib/tokens/listingNetwork';
import type { TokenOwnershipProof } from '@/lib/tokens/listingRecord';

function addressesMatch(a: string, b: string): boolean {
  try {
    return normalizeKaspaAddress(a).toLowerCase() === normalizeKaspaAddress(b).toLowerCase();
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

/** Normalize compressed / uncompressed / x-only pubkeys to 64-char x-only hex. */
function toXOnlyPubkeyHex(hex: string): string | null {
  const h = hex.trim().toLowerCase().replace(/^0x/, '');
  if (/^[a-f0-9]{64}$/.test(h)) return h;
  if (/^[a-f0-9]{66}$/.test(h) && (h.startsWith('02') || h.startsWith('03'))) return h.slice(2);
  if (/^[a-f0-9]{130}$/.test(h) && h.startsWith('04')) return h.slice(2, 66);
  return null;
}

function isPubkeyHex(value: string): boolean {
  return toXOnlyPubkeyHex(value) != null;
}

function buildDraftVerificationMessage(args: {
  symbol: string;
  contractAddress?: string;
  covenantId?: string;
  network: TokenListingNetwork;
  walletAddress: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kasparex.com';
  return [
    'Kasparex Token Deployer ownership verification',
    `Ticker: ${args.symbol || 'n/a'}`,
    `Network: ${getListingNetworkLabel(args.network)}`,
    `Contract: ${args.contractAddress || 'n/a'}`,
    args.covenantId ? `Covenant: ${args.covenantId}` : null,
    `Wallet: ${args.walletAddress}`,
    `Origin: ${origin}`,
    `Issued: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');
}

type TokenFormOwnershipGateProps = {
  symbol: string;
  listingNetwork: TokenListingNetwork;
  contractAddress?: string;
  covenantId?: string;
  expectedDeployer?: string;
  /** True when on-chain token metadata is loaded (KRC/KCC/L2). */
  tokenLoaded?: boolean;
  secondaryCount?: number;
  disabled?: boolean;
  alreadyVerified?: boolean;
  proof: TokenOwnershipProof | null;
  onVerified: (proof: TokenOwnershipProof) => void;
  onClear: () => void;
};

/**
 * Inline form gate: sign with deployer/owner wallet before Publish unlocks.
 * Primary network only. Extra networks stay unverified until dashboard verify (Partially verified).
 *
 * KCC-20: only wallets that match a matchable genesis owner (P2PK pubkey or Kaspa address)
 * can verify. Covenant-owned genesis without a public key cannot be proven here without genesis
 * spend authority, so publish stays locked.
 */
export function TokenFormOwnershipGate({
  symbol,
  listingNetwork,
  contractAddress,
  covenantId,
  expectedDeployer,
  tokenLoaded,
  secondaryCount = 0,
  disabled,
  alreadyVerified,
  proof,
  onVerified,
  onClear,
}: TokenFormOwnershipGateProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isL2 = listingNetwork === 'l2_kasplex' || listingNetwork === 'l2_igra';
  const isKcc20 = listingNetwork === 'kcc20';
  const isKaspaRail =
    listingNetwork === 'krc20' || listingNetwork === 'kcc20' || listingNetwork === 'kaspa_l1';

  const kaspaReady = kaspaState.isConnected && Boolean(kaspaState.address);
  const evmReady = isEvmConnected && Boolean(evmAddress);

  /** KCC-20 with no matchable deployer cannot open an anyone-can-sign path. */
  const kcc20Unmatchable =
    isKcc20 && Boolean(tokenLoaded || covenantId) && !expectedDeployer?.trim();

  const mismatch = useMemo(() => {
    if (!expectedDeployer) return null;
    if (isKaspaRail) {
      if (!kaspaReady || !kaspaState.address) return null;
      if (isPubkeyHex(expectedDeployer)) {
        // Pubkey match is checked async at verify time; do not block the button.
        return null;
      }
      return addressesMatch(kaspaState.address, expectedDeployer) ? null : expectedDeployer;
    }
    if (isL2) {
      if (!evmReady || !evmAddress) return null;
      return evmAddress.toLowerCase() === expectedDeployer.toLowerCase() ? null : expectedDeployer;
    }
    return null;
  }, [
    expectedDeployer,
    isKaspaRail,
    isL2,
    kaspaReady,
    kaspaState.address,
    evmReady,
    evmAddress,
  ]);

  const l2NoOwner = isL2 && !expectedDeployer;
  const verified = Boolean(proof) || Boolean(alreadyVerified);
  const canAttemptVerify = !l2NoOwner && !kcc20Unmatchable && Boolean(expectedDeployer?.trim());

  const handleVerify = async () => {
    setError(null);
    if (l2NoOwner) {
      setError('This L2 contract has no readable owner(). Deployer verification is unavailable.');
      return;
    }
    if (kcc20Unmatchable) {
      setError(
        'This KCC-20 genesis owner is another covenant (no P2PK pubkey). Hub cannot prove deployer control without a matchable genesis owner. Publish stays locked.',
      );
      return;
    }
    if (!expectedDeployer?.trim()) {
      setError('Load on-chain token data first so we can match the deployer or owner.');
      return;
    }

    setIsSigning(true);
    try {
      let walletAddress = '';
      let signature = '';

      if (isL2) {
        if (!evmReady || !evmAddress) {
          setError('Connect the EVM owner wallet (Kasplex / Igra) to verify.');
          return;
        }
        if (mismatch) {
          setError('Connected EVM wallet is not the on-chain owner. Switch wallets and try again.');
          return;
        }
        walletAddress = evmAddress;
        signature = await signMessageAsync({
          message: buildDraftVerificationMessage({
            symbol,
            contractAddress,
            covenantId,
            network: listingNetwork,
            walletAddress,
          }),
        });
      } else {
        if (!kaspaReady || !kaspaState.provider || !kaspaState.address) {
          setError('Connect the Kaspa deployer wallet to verify.');
          return;
        }

        if (isPubkeyHex(expectedDeployer)) {
          const wallet = getWalletProvider(kaspaState.provider as KaspaWalletProvider);
          const getPk = wallet?.getPublicKey;
          if (typeof getPk !== 'function') {
            setError('This wallet cannot expose a public key for deployer matching. Try KasWare / Kastle.');
            return;
          }
          const pk = await getPk.call(wallet);
          const expectedX = toXOnlyPubkeyHex(expectedDeployer);
          const walletX = pk ? toXOnlyPubkeyHex(pk) : null;
          if (!expectedX || !walletX || expectedX !== walletX) {
            setError('Connected Kaspa wallet public key does not match the on-chain genesis owner.');
            return;
          }
        } else if (mismatch) {
          setError('Connected Kaspa wallet is not the on-chain deployer. Switch wallets and try again.');
          return;
        }

        walletAddress = kaspaState.address;
        signature = await signKaspaMessage(
          kaspaState.provider as KaspaWalletProvider,
          buildDraftVerificationMessage({
            symbol,
            contractAddress,
            covenantId,
            network: listingNetwork,
            walletAddress,
          }),
        );
      }

      if (!signature) {
        setError('Signature was not provided.');
        return;
      }

      onVerified({
        method: 'deployer_signature',
        walletAddress,
        signature,
        verifiedAt: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed. Try again.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Verify ownership</p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Sign with the {isL2 ? 'EVM owner()' : isKcc20 ? 'Kaspa genesis owner' : 'Kaspa deployer'}{' '}
          wallet for <span className="font-semibold">{getListingNetworkLabel(listingNetwork)}</span>{' '}
          before publishing. Publish stays locked until this step succeeds.
        </p>
      </div>

      {expectedDeployer ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-500">
            {isL2
              ? 'On-chain owner'
              : isPubkeyHex(expectedDeployer)
                ? 'Genesis owner pubkey'
                : 'On-chain deployer'}
          </p>
          <p className="mt-0.5 break-all text-zinc-800 dark:text-zinc-200" title={expectedDeployer}>
            {expectedDeployer}
          </p>
        </div>
      ) : kcc20Unmatchable ? (
        <Alert type="warning" compact>
          This KCC-20 lists a covenant as genesis owner (common for KRON-native tokens). Without a
          P2PK pubkey or Kaspa address we can match, Hub cannot prove you control the token. Publish
          stays locked until the indexer exposes a matchable genesis owner.
        </Alert>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Connect and load your token first. We need the on-chain deployer or owner address.
        </p>
      )}

      {secondaryCount > 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          You also listed {secondaryCount} additional network
          {secondaryCount === 1 ? '' : 's'}. Those stay unverified for now. The listing shows{' '}
          <span className="font-semibold">Partially verified</span> until you prove each one from
          your Tokens dashboard.
        </p>
      ) : null}

      {l2NoOwner ? (
        <Alert type="info" compact>
          This L2 contract does not expose owner(). Deployer verification is not available, so Hub
          publish stays locked for this asset.
        </Alert>
      ) : null}

      {mismatch ? (
        <Alert type="error" compact>
          Connected wallet does not match the on-chain {isL2 ? 'owner' : 'deployer'}.
        </Alert>
      ) : null}

      {error ? (
        <Alert type="error" compact onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {verified ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          <span>
            Primary network verified
            {secondaryCount > 0 ? ' (partial until other networks are proven)' : ''}.
          </span>
          {!alreadyVerified && proof ? (
            <button type="button" className="text-xs font-semibold underline" onClick={onClear} disabled={disabled}>
              Clear
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={disabled || isSigning || !canAttemptVerify}
          className={`${KX_FORM_ADD_BTN_CLASS} disabled:opacity-50`}
        >
          {isSigning ? 'Waiting for signature…' : 'Verify ownership to unlock publish'}
        </button>
      )}
    </div>
  );
}

/** Listing badge helper for multi-network verification. */
export function getTokenNetworksVerificationLabel(networks?: Array<{ verified?: boolean; contractAddress?: string }>): {
  label: 'Verified' | 'Partially verified' | 'Unverified';
  verifiedCount: number;
  filledCount: number;
} {
  const filled = (networks ?? []).filter((n) => Boolean(n.contractAddress?.trim()) || n.verified);
  const rows = filled.length > 0 ? filled : networks ?? [];
  const verifiedCount = rows.filter((n) => n.verified).length;
  const filledCount = rows.length;
  if (verifiedCount <= 0) return { label: 'Unverified', verifiedCount, filledCount };
  if (filledCount > 1 && verifiedCount < filledCount) {
    return { label: 'Partially verified', verifiedCount, filledCount };
  }
  return { label: 'Verified', verifiedCount, filledCount };
}
