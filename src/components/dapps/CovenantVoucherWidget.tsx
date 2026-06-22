'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantVoucher } from '@/hooks/useCovenantVoucher';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';

function shortAddr(a: string) {
  const x = a.replace(/^kaspa:/i, '');
  return x.length > 14 ? `${x.slice(0, 8)}...${x.slice(-4)}` : x;
}

export function CovenantVoucherWidget() {
  const { state } = useKaspaWallet();
  const { openVouchers, loading, error, createVoucher, claimVoucher, refresh } = useCovenantVoucher();
  const [tab, setTab] = useState<'create' | 'claim'>('create');
  const [amountKas, setAmountKas] = useState('0.1');
  const [memo, setMemo] = useState('');
  const [expires, setExpires] = useState('');
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [claimId, setClaimId] = useState('');
  const [claimSecret, setClaimSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  if (!state.isConnected) {
    return (
      <p className="px-6 py-8 text-center text-zinc-500">
        Connect wallet to mint or redeem hashlock vouchers.
      </p>
    );
  }

  const handleCreate = async () => {
    if (!expires) return;
    setBusy(true);
    try {
      const { voucher, secret } = await createVoucher({
        amountKas: parseFloat(amountKas),
        memo,
        expiresAt: new Date(expires),
      });
      setIssuedSecret(secret);
      setIssuedId(voucher.id);
      setTab('claim');
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    setBusy(true);
    try {
      await claimVoucher(claimId.trim(), claimSecret);
      setClaimSecret('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-6 py-4 max-w-2xl mx-auto space-y-4">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Covenant Voucher</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Hashlock gift cards: lock KAS, share a secret, anyone with the preimage claims before expiry.
        </p>
      </header>
      <div className="flex gap-2">
        {(['create', 'claim'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${tab === t ? 'bg-[#02abb8] text-white' : 'text-zinc-500'}`}
          >
            {t === 'create' ? 'Mint voucher' : 'Redeem'}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {issuedSecret && issuedId && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Save this secret (shown once):</p>
          <p className="font-mono break-all mt-1">{issuedSecret}</p>
          <p className="text-xs mt-2 text-zinc-500">Voucher ID: {issuedId}</p>
        </div>
      )}
      {tab === 'create' && (
        <div className="space-y-3 border rounded-xl p-4">
          <input
            type="number"
            min={minKas}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            value={amountKas}
            onChange={(e) => setAmountKas(e.target.value)}
          />
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            placeholder="Memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreate()}
            className="w-full py-2 bg-[#02abb8] text-white rounded-lg disabled:opacity-50"
          >
            Lock and mint voucher
          </button>
        </div>
      )}
      {tab === 'claim' && (
        <div className="space-y-3">
          <div className="border rounded-xl p-4 space-y-2">
            <input
              className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
              placeholder="Voucher ID"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
            />
            <input
              className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
              placeholder="Claim secret"
              value={claimSecret}
              onChange={(e) => setClaimSecret(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleClaim()}
              className="w-full py-2 border border-[#02abb8] text-[#02abb8] rounded-lg"
            >
              Redeem voucher
            </button>
          </div>
          <p className="text-xs text-zinc-500">Open vouchers ({openVouchers.length})</p>
          {loading ? (
            <p className="text-zinc-500 text-sm">Loading...</p>
          ) : (
            openVouchers.map((v) => (
              <div
                key={v.id}
                className="text-sm border rounded-lg p-3 flex justify-between cursor-pointer hover:border-[#02abb8]"
                onClick={() => setClaimId(v.id)}
              >
                <span>{sompiToKasNumber(v.amountSompi)} KAS</span>
                <span className="text-zinc-500 text-xs">{shortAddr(v.creator)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
