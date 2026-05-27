'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export function ReceiveAddressModal({
  isOpen,
  onClose,
  title = 'Receive',
  address,
  displayAddress,
  insName,
  onCopy,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  address: string;
  displayAddress: string;
  insName?: string | null;
  onCopy: () => void | Promise<void>;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setQrError(null);
        setQrDataUrl(null);
        const mod = await import('qrcode');
        const url = await mod.toDataURL(address, { margin: 1, scale: 6 });
        if (!cancelled) setQrDataUrl(url);
      } catch (e: any) {
        if (!cancelled) setQrError(e?.message || 'Failed to generate QR code.');
      }
    };
    if (typeof window !== 'undefined' && isOpen && address) run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, address]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Copy your address to receive funds.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Receive address QR code"
                className="w-40 h-40 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
              />
            ) : (
              <div className="w-40 h-40 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                {qrError ? 'QR unavailable' : 'Generating QR…'}
              </div>
            )}
          </div>
          {qrError ? <div className="text-xs text-red-600 dark:text-red-400 text-center">{qrError}</div> : null}
          {insName ? (
            <div className="rounded-lg border border-[#02abb8]/20 bg-[#02abb8]/5 px-3 py-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">INS name</div>
              <div className="text-sm font-semibold text-[#02abb8] mt-0.5">{insName}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Send to this .igra name on Igra Mainnet</div>
            </div>
          ) : null}
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Address</div>
          <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
            {displayAddress}
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy address
          </button>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
            Make sure you’re sending to the correct network.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

