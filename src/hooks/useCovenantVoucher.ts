'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getVoucherRuntime,
  getActiveCovenantRuntimeMode,
  kasToSompiString,
  randomHex,
  sha256Hex,
  runKpxCovenantDeployWithFee,
  awardKpxCovenantClaimPoints,
  resolveKpxCovenantDeployPrice,
  type VoucherLock,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';

export function useCovenantVoucher() {
  const { state } = useKaspaWallet();
  const runtime = getVoucherRuntime();
  const { tier: krexTier } = useKREXBalance();
  const [vouchers, setVouchers] = useState<VoucherLock[]>([]);
  const [openVouchers, setOpenVouchers] = useState<VoucherLock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletCtx = useCallback(() => {
    if (!state.isConnected || !state.address || !state.provider) {
      throw new Error('Connect wallet first');
    }
    return {
      provider: state.provider as KaspaWalletProvider,
      userAddress: state.address,
    };
  }, [state.address, state.isConnected, state.provider]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOpenVouchers(await runtime.listOpen());
      if (state.address) {
        setVouchers(await runtime.listForAddress(state.address));
      } else {
        setVouchers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [runtime, state.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createVoucher = useCallback(
    async (args: { amountKas: number; memo: string; expiresAt: Date }) => {
      const secret = `kpx-${randomHex(16)}`;
      const secretHash = await sha256Hex(secret);
      const pricing = resolveKpxCovenantDeployPrice('voucher', krexTier);
      const voucher = await runKpxCovenantDeployWithFee({
        template: 'voucher',
        pricing,
        ctx: walletCtx(),
        create: () =>
          runtime.create(
            {
              creator: walletCtx().userAddress,
              amountSompi: kasToSompiString(args.amountKas),
              secretHash,
              memo: args.memo,
              expiresAt: args.expiresAt.getTime(),
            },
            walletCtx(),
          ),
      });
      await refresh();
      return { voucher, secret };
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  const claimVoucher = useCallback(
    async (voucherId: string, secret: string) => {
      const v = await runtime.claim(voucherId, secret, walletCtx().userAddress, walletCtx());
      awardKpxCovenantClaimPoints({
        walletAddress: walletCtx().userAddress,
        template: 'voucher',
        instanceId: voucherId,
        krexTier,
      });
      await refresh();
      return v;
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  return {
    vouchers,
    openVouchers,
    loading,
    error,
    runtimeMode: getActiveCovenantRuntimeMode(),
    effectiveMode: runtime.effectiveMode,
    refresh,
    createVoucher,
    claimVoucher,
  };
}
