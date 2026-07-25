'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { L1WalletLogo } from '@/components/wallet/L1WalletLogo';
import {
  buildKaspireAppLink,
  isAndroidUserAgent,
  KASPIRE_DOWNLOAD_URL,
} from '@/lib/kaspa/kaspireWc';

export function KaspirePairingModal({
  uri,
  mode,
  onCancel,
}: {
  uri: string | null;
  /** Desktop shows QR; mobile only deep-links / wait UI. */
  mode: 'desktop' | 'mobile';
  onCancel: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const isAndroid = isAndroidUserAgent();
  const showQr = mode === 'desktop';

  useEffect(() => {
    if (!showQr || !uri) {
      setQrDataUrl(null);
      setQrError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const mod = await import('qrcode');
        const toDataURL = mod.toDataURL ?? (mod as { default?: { toDataURL?: typeof mod.toDataURL } }).default?.toDataURL;
        if (typeof toDataURL !== 'function') {
          throw new Error('QR generator unavailable');
        }
        const url = await toDataURL(uri, {
          width: 240,
          margin: 2,
          color: { dark: '#09090b', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
        if (!cancelled) {
          setQrDataUrl(url);
          setQrError(null);
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl(null);
          setQrError('Could not render QR. Use the App Link below from your Android phone.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri, showQr]);

  useEffect(() => {
    if (mode !== 'mobile' || !uri || !isAndroid) return;
    // Open App Link without navigating away so approval() stays alive.
    const link = buildKaspireAppLink(uri);
    const opened = window.open(link, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.assign(link);
    }
  }, [uri, mode, isAndroid]);

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
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Connect Kaspire</h2>
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-100/80 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                Beta
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {mode === 'mobile'
                ? 'Opens the installed Kaspire APK for approval (WalletConnect).'
                : 'Scan this QR with the Kaspire Android app (APK).'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          {showQr ? (
            qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Kaspire WalletConnect QR code"
                width={240}
                height={240}
                className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700"
              />
            ) : (
              <div className="flex h-[240px] w-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 text-center text-xs text-zinc-500 dark:border-zinc-600">
                {!uri ? 'Starting WalletConnect…' : qrError ?? 'Preparing QR…'}
              </div>
            )
          ) : (
            <div className="w-full space-y-2 rounded-xl border border-teal-500/30 bg-teal-500/5 px-4 py-4 text-center text-sm text-zinc-700 dark:text-zinc-200">
              <p>
                {uri
                  ? 'If Kaspire is installed, it should open for approval. If the website opens instead, install the APK first, then tap Open Kaspire.'
                  : 'Starting WalletConnect session…'}
              </p>
              <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                Tip: pairing from a desktop QR is the most reliable flow while Kaspire is APK-only (no Play Store listing yet).
              </p>
            </div>
          )}

          <p className="text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            Waiting for approval in Kaspire. Keep this page open until the wallet confirms.
          </p>

          {mode === 'mobile' ? (
            <div className="flex w-full flex-col gap-2">
              <a
                href={uri ? buildKaspireAppLink(uri) : KASPIRE_DOWNLOAD_URL}
                className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-700"
              >
                Open Kaspire
              </a>
              <a
                href={KASPIRE_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Download Kaspire APK
              </a>
            </div>
          ) : (
            <a
              href={KASPIRE_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
            >
              Download Kaspire APK (Android)
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
