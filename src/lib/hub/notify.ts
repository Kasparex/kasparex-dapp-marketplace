/**
 * Global Hub notification API (bottom-right toast cards).
 *
 * Prefer `useHubNotify()` in components. Use `hubNotify.*` from callbacks /
 * non-React modules after `ToasterProvider` has mounted.
 */

import { useToast, type ToastInput, type ToastVariant } from '@/components/ui/Toaster';
import { getHubNotifyApi } from '@/lib/hub/notifyBridge';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { getExplorerTxUrlForChain } from '@/lib/dapps/deployer';

export type HubNotifyVariant = ToastVariant;

export type HubNotifyOptions = {
  title: string;
  description?: string;
  variant?: HubNotifyVariant;
  duration?: number;
  href?: string;
  linkLabel?: string;
  /** Reuse / replace an existing toast (e.g. loading → success). */
  id?: string;
};

export type HubTxNotifyOptions = {
  title: string;
  description?: string;
  txHash: string;
  /** Kaspa L1 when omitted. Pass EVM chainId for L2 explorers. */
  chainId?: number;
  /** Kaspa L1 network for explorer links (defaults mainnet). */
  network?: 'mainnet' | 'testnet-10';
  linkLabel?: string;
  duration?: number;
  id?: string;
};

function shortenTx(txHash: string): string {
  const t = txHash.trim();
  if (t.length <= 16) return t;
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

function explorerForTx(
  txHash: string,
  chainId?: number,
  network?: 'mainnet' | 'testnet-10',
): string {
  if (chainId != null && chainId > 0) return getExplorerTxUrlForChain(chainId, txHash);
  return getExplorerTxUrl(txHash, network);
}

/** Normalize unknown thrown values / API strings for toast copy. */
export function hubNotifyMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err == null) return fallback;
  if (typeof err === 'string') {
    const t = err.trim();
    return t || fallback;
  }
  if (err instanceof Error) {
    const t = err.message.trim();
    return t || fallback;
  }
  try {
    const s = String(err).trim();
    return s || fallback;
  } catch {
    return fallback;
  }
}

/**
 * One-shot action error toast. Prefer this (or hubNotify.*) over inline Alert banners.
 * Returns the message so callers can drop local error display state.
 */
export function notifyActionError(
  title: string,
  err: unknown,
  fallback = 'Something went wrong',
  extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
): string {
  const message = hubNotifyMessage(err, fallback);
  push({ title, description: message, variant: 'error', ...extra });
  return message;
}

/** One-shot action warning (validation, user reject, soft blocks). */
export function notifyActionWarning(
  title: string,
  err: unknown,
  fallback = 'Please check and try again',
  extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
): string {
  const message = hubNotifyMessage(err, fallback);
  push({ title, description: message, variant: 'warning', ...extra });
  return message;
}

function push(options: HubNotifyOptions): string {
  const api = getHubNotifyApi();
  if (!api) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[hubNotify] ToasterProvider not mounted yet', options.title);
    }
    return options.id ?? '';
  }
  const input: ToastInput = {
    id: options.id,
    title: options.title,
    description: options.description,
    variant: options.variant ?? 'info',
    duration: options.duration,
    href: options.href,
    linkLabel: options.linkLabel,
  };
  return api.toast(input);
}

function updateToast(id: string, options: Omit<HubNotifyOptions, 'id'>) {
  const api = getHubNotifyApi();
  api?.update(id, {
    title: options.title,
    description: options.description,
    variant: options.variant,
    duration: options.duration,
    href: options.href,
    linkLabel: options.linkLabel,
  });
}

/** Imperative Hub notify (safe after Providers mount). */
export const hubNotify = {
  show(options: HubNotifyOptions): string {
    return push(options);
  },
  success(title: string, description?: string, extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>) {
    return push({ title, description, variant: 'success', ...extra });
  },
  error(title: string, description?: string, extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>) {
    return push({ title, description, variant: 'error', ...extra });
  },
  warning(title: string, description?: string, extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>) {
    return push({ title, description, variant: 'warning', ...extra });
  },
  info(title: string, description?: string, extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>) {
    return push({ title, description, variant: 'info', ...extra });
  },
  loading(title: string, description?: string, extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>) {
    return push({ title, description, variant: 'loading', duration: 0, ...extra });
  },
  txSuccess(options: HubTxNotifyOptions): string {
    const href = explorerForTx(options.txHash, options.chainId, options.network);
    return push({
      id: options.id,
      title: options.title,
      description: options.description ?? `Tx ${shortenTx(options.txHash)}`,
      variant: 'success',
      duration: options.duration,
      href,
      linkLabel: options.linkLabel ?? 'View in explorer',
    });
  },
  update: updateToast,
  dismiss(id: string) {
    getHubNotifyApi()?.dismiss(id);
  },
  dismissAll() {
    getHubNotifyApi()?.dismissAll();
  },
};

/** React hook: typed helpers on top of `useToast`. */
export function useHubNotify() {
  const { toast, update, dismiss, dismissAll } = useToast();

  const show = (options: HubNotifyOptions) =>
    toast({
      id: options.id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'info',
      duration: options.duration,
      href: options.href,
      linkLabel: options.linkLabel,
    });

  return {
    notify: show,
    success: (
      title: string,
      description?: string,
      extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
    ) => show({ title, description, variant: 'success', ...extra }),
    error: (
      title: string,
      description?: string,
      extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
    ) => show({ title, description, variant: 'error', ...extra }),
    warning: (
      title: string,
      description?: string,
      extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
    ) => show({ title, description, variant: 'warning', ...extra }),
    info: (
      title: string,
      description?: string,
      extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
    ) => show({ title, description, variant: 'info', ...extra }),
    loading: (
      title: string,
      description?: string,
      extra?: Omit<HubNotifyOptions, 'title' | 'description' | 'variant'>,
    ) => show({ title, description, variant: 'loading', duration: 0, ...extra }),
    txSuccess: (options: HubTxNotifyOptions) => {
      const href = explorerForTx(options.txHash, options.chainId, options.network);
      return show({
        id: options.id,
        title: options.title,
        description: options.description ?? `Tx ${shortenTx(options.txHash)}`,
        variant: 'success',
        duration: options.duration,
        href,
        linkLabel: options.linkLabel ?? 'View in explorer',
      });
    },
    update: (id: string, options: Omit<HubNotifyOptions, 'id'>) =>
      update(id, {
        title: options.title,
        description: options.description,
        variant: options.variant,
        duration: options.duration,
        href: options.href,
        linkLabel: options.linkLabel,
      }),
    dismiss,
    dismissAll,
  };
}
