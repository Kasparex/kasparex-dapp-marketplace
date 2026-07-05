'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { erc20Abi, isAddress, parseUnits } from 'viem';
import { useAccount, useBalance, useChainId, useReadContract, useSendTransaction, useWriteContract } from 'wagmi';
import { createInsClient } from '@/lib/ins/client';
import { isIgraMainnet } from '@/lib/ins/config';
import {
  isInsNameExpired,
  isZeroAddress,
  looksLikeInsRecipient,
  normalizeInsName,
} from '@/lib/ins/utils';
import { shortenAddress } from '@/lib/walletUi';

const KASPLEX_KREX_TOKEN_CA = '0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B' as const;
const IGRA_KREX_TOKEN_CA = '0x9C31bB7A012A99dA04AAD94a1CB9176DAF28270D' as const;

function getL2KrexTokenAddress(chainId: number | null | undefined): `0x${string}` | null {
  if (!chainId) return null;
  if (chainId === 202555 || chainId === 167012) return KASPLEX_KREX_TOKEN_CA;
  if (chainId === 38836 || chainId === 38833) return IGRA_KREX_TOKEN_CA;
  return null;
}

type RecipientResolution = {
  resolvedAddress: `0x${string}` | null;
  displayName: string | null;
  tenure: string | null;
  expiresAt: string | null;
  isResolving: boolean;
  resolveError: string | null;
};

export function SendL2TransactionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const chainId = useChainId();
  const { address } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'kas' | 'krex'>('kas');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [resolution, setResolution] = useState<RecipientResolution>({
    resolvedAddress: null,
    displayName: null,
    tenure: null,
    expiresAt: null,
    isResolving: false,
    resolveError: null,
  });

  const krexToken = getL2KrexTokenAddress(chainId);
  const onIgraMainnet = isIgraMainnet(chainId);

  const { data: nativeBal } = useBalance({ address });
  const { data: krexBalRaw, refetch: refetchKrex } = useReadContract({
    abi: erc20Abi,
    address: krexToken || undefined,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && krexToken) },
  });
  const { data: krexDecimals } = useReadContract({
    abi: erc20Abi,
    address: krexToken || undefined,
    functionName: 'decimals',
    query: { enabled: Boolean(krexToken) },
  });

  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  const krexBalanceDisplay = useMemo(() => {
    if (!krexBalRaw || typeof krexDecimals !== 'number') return '-';
    const denom = BigInt(10) ** BigInt(krexDecimals);
    const whole = (krexBalRaw as bigint) / denom;
    const frac = (krexBalRaw as bigint) % denom;
    const fracStr = frac.toString().padStart(krexDecimals, '0').slice(0, 6);
    return `${whole.toString()}.${fracStr}`.replace(/\.?0+$/, '');
  }, [krexBalRaw, krexDecimals]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTab('kas');
      setToAddress('');
      setAmount('');
      setError(null);
      setTxHash(null);
      setResolution({
        resolvedAddress: null,
        displayName: null,
        tenure: null,
        expiresAt: null,
        isResolving: false,
        resolveError: null,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const raw = toAddress.trim();
    if (!raw) {
      setResolution({
        resolvedAddress: null,
        displayName: null,
        tenure: null,
        expiresAt: null,
        isResolving: false,
        resolveError: null,
      });
      return;
    }

    if (isAddress(raw)) {
      setResolution({
        resolvedAddress: raw as `0x${string}`,
        displayName: null,
        tenure: null,
        expiresAt: null,
        isResolving: false,
        resolveError: null,
      });
      return;
    }

    if (!looksLikeInsRecipient(raw)) {
      setResolution({
        resolvedAddress: null,
        displayName: null,
        tenure: null,
        expiresAt: null,
        isResolving: false,
        resolveError: 'Enter a valid EVM address (0x…) or .igra name.',
      });
      return;
    }

    if (!onIgraMainnet) {
      setResolution({
        resolvedAddress: null,
        displayName: normalizeInsName(raw),
        tenure: null,
        expiresAt: null,
        isResolving: false,
        resolveError: 'INS names resolve on Igra Mainnet only. Switch network to send.',
      });
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setResolution((prev) => ({ ...prev, isResolving: true, resolveError: null }));
      try {
        const ins = createInsClient();
        const name = normalizeInsName(raw);
        const res = await ins.resolveName(name);
        if (cancelled) return;
        if (!res?.exists || !res.address || isZeroAddress(res.address)) {
          setResolution({
            resolvedAddress: null,
            displayName: name,
            tenure: (res?.tenure as string | undefined) ?? null,
            expiresAt: (res?.expires_at as string | null | undefined) ?? null,
            isResolving: false,
            resolveError: `Name not found: ${name}`,
          });
          return;
        }
        if (isInsNameExpired(res.expires_at, res.tenure)) {
          setResolution({
            resolvedAddress: null,
            displayName: name,
            tenure: (res.tenure as string | undefined) ?? null,
            expiresAt: (res.expires_at as string | null | undefined) ?? null,
            isResolving: false,
            resolveError: `${name} has expired.`,
          });
          return;
        }
        setResolution({
          resolvedAddress: res.address as `0x${string}`,
          displayName: name,
          tenure: (res.tenure as string | undefined) ?? null,
          expiresAt: (res.expires_at as string | null | undefined) ?? null,
          isResolving: false,
          resolveError: null,
        });
      } catch {
        if (!cancelled) {
          setResolution({
            resolvedAddress: null,
            displayName: normalizeInsName(raw),
            tenure: null,
            expiresAt: null,
            isResolving: false,
            resolveError: 'Failed to resolve INS name.',
          });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [toAddress, onIgraMainnet]);

  if (!isOpen || !mounted) return null;

  const canSend = Boolean(
    amount &&
      Number(amount) > 0 &&
      resolution.resolvedAddress &&
      !resolution.isResolving &&
      !resolution.resolveError,
  );

  const handleSend = async () => {
    setError(null);
    try {
      if (!address) throw new Error('Connect your L2 wallet first.');
      const to = resolution.resolvedAddress;
      if (!to) throw new Error(resolution.resolveError || 'Enter a valid recipient.');

      if (tab === 'kas') {
        const value = parseUnits(amount, nativeBal?.decimals ?? 18);
        const res = await sendTransactionAsync({ to, value });
        setTxHash(res);
      } else {
        if (!krexToken) throw new Error('KREX is not available on this network.');
        const decimals = typeof krexDecimals === 'number' ? krexDecimals : 18;
        const value = parseUnits(amount, decimals);
        const res = await writeContractAsync({
          abi: erc20Abi,
          address: krexToken,
          functionName: 'transfer',
          args: [to, value],
        });
        setTxHash(res);
        void refetchKrex();
      }
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Failed to send.');
    }
  };

  const recipientPreview = resolution.displayName && resolution.resolvedAddress
    ? `${resolution.displayName} → ${shortenAddress(resolution.resolvedAddress, { head: 6, tail: 4 })}`
    : null;

  return createPortal(
    <>
      <div className="kx-modal-overlay fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:w-full max-w-md border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Send KAS / KREX</h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {txHash ? (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-green-700 dark:text-green-400 font-semibold">Transaction submitted</div>
                {resolution.displayName ? (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    To: {resolution.displayName}
                  </div>
                ) : null}
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 break-all">{txHash}</div>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="inline-flex w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                <button
                  type="button"
                  onClick={() => setTab('kas')}
                  className={[
                    'flex-1 px-3 py-2 text-sm font-bold rounded-lg transition-colors',
                    tab === 'kas'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-700/60',
                  ].join(' ')}
                >
                  Send KAS
                </button>
                <button
                  type="button"
                  onClick={() => setTab('krex')}
                  className={[
                    'flex-1 px-3 py-2 text-sm font-bold rounded-lg transition-colors',
                    tab === 'krex'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-700/60',
                  ].join(' ')}
                >
                  Send KREX
                </button>
              </div>

              <div>
                <label className="k-label">Recipient (0x… or name.igra)</label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder={onIgraMainnet ? '0x… or alice.igra' : '0x…'}
                  className="k-input"
                />
                {resolution.isResolving ? (
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Resolving INS name…</div>
                ) : null}
                {recipientPreview ? (
                  <div className="mt-2 text-xs font-mono text-[#02abb8]">{recipientPreview}</div>
                ) : null}
                {resolution.tenure ? (
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Tenure: {resolution.tenure}
                    {resolution.expiresAt ? ` · expires ${new Date(resolution.expiresAt).toLocaleDateString()}` : ''}
                  </div>
                ) : null}
                {resolution.resolveError ? (
                  <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">{resolution.resolveError}</div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="k-label !mb-0 flex items-center gap-1.5 whitespace-nowrap">
                    Amount ({tab === 'kas' ? 'KAS' : 'KREX'})
                  </label>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-500">
                    Balance:{' '}
                    {tab === 'kas'
                      ? nativeBal
                        ? `${Number(nativeBal.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${nativeBal.symbol}`
                        : ' - '
                      : krexBalanceDisplay}
                  </div>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  className="k-input"
                />
              </div>

              {error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex-1 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
