'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { L1WalletLogo } from '@/components/wallet/L1WalletLogo';
import {
  buildKaspireAppLink,
  isAndroidUserAgent,
  KASPIRE_DOWNLOAD_URL,
} from '@/lib/kaspa/kaspireWc';

export function KaspirePairingModal({
  uri,
  onCancel,
}: {
  uri: string | null;
  onCancel: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const isAndroid = isAndroidUserAgent();

  useEffect(() => {
    if (!uri) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(uri, {
      width: 240,
      margin: 2,
      color: { dark: '#09090b', light: '#ffffff' },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  useEffect(() => {
    if (!uri || !isAndroid) return;
    // Open App Link without navigating away, so the WalletConnect approval promise stays alive.
    const link = buildKaspireAppLink(uri);
    const opened = window.open(link, '_blank', 'noopener,noreferrer');
    if (!opened) {
      // Popup blocked: fall back to same-tab App Link (browser usually keeps the tab in background).
      window.location.assign(link);
    }
  }, [uri, isAndroid]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="kx-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Connect Kaspire"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <L1WalletLogo provider="kaspire" size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Connect Kaspire</h2>
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Beta
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {isAndroid
                ? 'Approve the session in the Kaspire app.'
                : 'Scan with Kaspire on Android, or open the App Link on your phone.'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Kaspire WalletConnect QR code"
              width={240}
              height={240}
              className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700"
            />
          ) : (
            <div className="flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-600">
              Preparing QR…
            </div>
          )}

          <p className="text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            Waiting for approval in Kaspire. Do not close this window until the wallet confirms.
          </p>

          {isAndroid ? (
            <a
              href={uri ? buildKaspireAppLink(uri) : KASPIRE_DOWNLOAD_URL}
              className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-700"
            >
              Open Kaspire
            </a>
          ) : (
            <a
              href={KASPIRE_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
            >
              Get Kaspire for Android
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
