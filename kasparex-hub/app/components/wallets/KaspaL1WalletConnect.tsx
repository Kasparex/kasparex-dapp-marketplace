/**
 * Unified L1 Kaspa connect: dropdown to pick KasWare or Kastle when disconnected;
 * connected summary + balance, network, optional KRC-20, actions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useKaspaWallet } from "~/lib/kaspa/provider";
import {
  isKaswareInstalled,
  getKaswareKrc20Balances,
} from "~/lib/kaspa/kasware";
import { isKastleInstalled, getKastleKrc20Balances } from "~/lib/kaspa/kastle";

const KASWARE_DOCS = "https://docs.kasware.xyz/wallet/";
const KASTLE_DOCS = "https://docs.kastle.cc/";

function formatKas(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function shortAddr(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

type KaspaL1WalletConnectProps = {
  /** Wider trigger + menu (e.g. profile page) */
  variant?: "compact" | "comfortable";
  /** Stretch dropdown to parent width (e.g. mobile drawer) */
  fullWidthMenu?: boolean;
};

export function KaspaL1WalletConnect({
  variant = "compact",
  fullWidthMenu = false,
}: KaspaL1WalletConnectProps) {
  const {
    address,
    balance,
    network,
    walletType,
    isConnected,
    isLoading,
    connect,
    disconnect,
    refresh,
  } = useKaspaWallet();

  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<"kasware" | "kastle" | null>(
    null
  );
  const [krc20, setKrc20] = useState<
    Array<{ tick: string; amount: string | number }>
  >([]);
  const [krc20Loading, setKrc20Loading] = useState(false);
  const [copied, setCopied] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const kaswareHere = isKaswareInstalled();
  const kastleHere = isKastleInstalled();

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!isConnected || !walletType || !address) {
      setKrc20([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setKrc20Loading(true);
      try {
        const list =
          walletType === "kasware"
            ? await getKaswareKrc20Balances()
            : await getKastleKrc20Balances();
        if (!cancelled) setKrc20(list);
      } catch {
        if (!cancelled) setKrc20([]);
      } finally {
        if (!cancelled) setKrc20Loading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isConnected, walletType, address]);

  const onPickWallet = useCallback(
    async (w: "kasware" | "kastle") => {
      setConnecting(w);
      try {
        await connect(w);
        setOpen(false);
      } catch {
        /* provider sets error */
      } finally {
        setConnecting(null);
      }
    },
    [connect]
  );

  const triggerClass =
    variant === "comfortable"
      ? "w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-[#02abb8] dark:hover:border-[#02abb8] sm:w-auto sm:justify-start"
      : "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm sm:text-base";

  const menuClass = fullWidthMenu
    ? "absolute z-[100] mt-2 left-0 right-0 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2"
    : "absolute z-[100] mt-2 min-w-[16rem] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 left-0 right-auto";

  if (!isConnected || !address || !walletType) {
    return (
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          className={triggerClass}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((o) => !o)}
          disabled={isLoading || connecting !== null}
        >
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 rounded-md">
            L1
          </span>
          <span>Connect wallet</span>
          <svg
            className={`w-4 h-4 opacity-70 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {open && (
          <div className={menuClass} role="menu">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Kaspa (L1)
            </div>
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 flex flex-col gap-0.5"
              disabled={!kaswareHere || connecting !== null}
              onClick={() => onPickWallet("kasware")}
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                KasWare
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {kaswareHere
                  ? "Connect with KasWare extension"
                  : "Extension not detected"}
              </span>
              {!kaswareHere && (
                <a
                  href={KASWARE_DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#02abb8] hover:underline mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Get KasWare
                </a>
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 flex flex-col gap-0.5 border-t border-zinc-100 dark:border-zinc-800"
              disabled={!kastleHere || connecting !== null}
              onClick={() => onPickWallet("kastle")}
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Kastle
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {kastleHere
                  ? "Connect with Kastle extension"
                  : "Extension not detected"}
              </span>
              {!kastleHere && (
                <a
                  href={KASTLE_DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#02abb8] hover:underline mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Get Kastle
                </a>
              )}
            </button>
            {connecting && (
              <div className="px-4 py-2 text-xs text-zinc-500 flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#02abb8] border-t-transparent" />
                Connecting…
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const label = walletType === "kasware" ? "KasWare" : "Kastle";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 rounded-md">
          L1
        </span>
        <span className="truncate max-w-[10rem] sm:max-w-[14rem]">
          {label} · {shortAddr(address)}
        </span>
        <svg
          className={`w-4 h-4 opacity-70 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className={menuClass} role="menu">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                Connected
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 break-all">
              {address}
            </p>
            {network && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Network:{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {network}
                </span>
              </p>
            )}
            <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
                KAS balance
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatKas(balance)}{" "}
                <span className="text-sm font-normal text-zinc-500">KAS</span>
              </div>
            </div>
          </div>

          {krc20Loading ? (
            <div className="px-4 py-2 text-xs text-zinc-500">Loading tokens…</div>
          ) : krc20.length > 0 ? (
            <div className="px-4 py-2 max-h-40 overflow-y-auto border-b border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                KRC-20
              </div>
              <ul className="space-y-1">
                {krc20.slice(0, 20).map((t) => (
                  <li
                    key={t.tick}
                    className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="font-medium">{t.tick}</span>
                    <span className="font-mono">{String(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="p-2 flex flex-col gap-1">
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
              onClick={async () => {
                await refresh();
                setCopied(false);
              }}
            >
              Refresh balance
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
              onClick={async () => {
                if (!address) return;
                try {
                  await navigator.clipboard.writeText(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* ignore */
                }
              }}
            >
              {copied ? "Copied address" : "Copy address"}
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400"
              onClick={async () => {
                await disconnect();
                setOpen(false);
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
