/**
 * Kaspire WalletConnect v2 (Kaspire protocol v2) adapter for Kaspa L1.
 * @see https://kaspire.kaslab.space/developers
 */

import { SignClient } from '@walletconnect/sign-client';
import type { KaspaTransactionRequest, KaspaWalletProviderInterface } from './types';

export const KASPIRE_CHAIN_ID = 'kaspa:mainnet';
export const KASPIRE_APP_LINK_BASE = 'https://kaspire.kaslab.space/kaspire/wc';
export const KASPIRE_DOWNLOAD_URL = 'https://kaspire.kaslab.space/';
export const KASPIRE_DOCS_URL = 'https://kaspire.kaslab.space/developers';
/** IRN relay (required by Kaspire protocol v2). */
export const KASPIRE_RELAY_URL = 'wss://relay.walletconnect.com';

const KASPIRE_METHODS = [
  'kaspa_getAccounts',
  'kaspa_signPersonal',
  'kaspa_sendTransaction',
  'kaspa_sendKrc20',
  'kaspa_sendKcc20',
  'kaspa_signPskt',
] as const;

const KASPIRE_EVENTS = ['accountsChanged'] as const;

/** Isolate Kaspire WC storage from RainbowKit / wagmi WalletConnect. */
const KASPIRE_WC_STORAGE = 'kasparex_kaspire_wc_v1';

type PairingUriHandler = (uri: string) => void;

/** Infer session type from SignClient to avoid dual @walletconnect/types copies. */
type KaspireSignClient = Awaited<ReturnType<typeof SignClient.init>>;
type KaspireSession = ReturnType<KaspireSignClient['session']['getAll']>[number];

let signClientPromise: Promise<KaspireSignClient> | null = null;
let activeSession: KaspireSession | null = null;
/** AbortController for the in-flight pairing (covers propose + approval). */
let pairingAbort: AbortController | null = null;
const accountListeners = new Set<(accounts: string[]) => void>();

export function isKaspirePairingCancelled(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /kaspire pairing cancelled/i.test(msg);
}

function throwIfPairingAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error('Kaspire pairing cancelled');
  }
}

function getProjectId(): string {
  const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  if (!id || id === 'default-project-id') {
    throw new Error(
      'WalletConnect project ID is missing. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in Vercel (same value RainbowKit already uses for L2).',
    );
  }
  return id;
}

export function buildKaspireAppLink(uri: string): string {
  // Dedicated Kaspire App Link. Do not put the raw wc: URI in a QR code:
  // Kaspire is not in Reown WalletGuide, so generic WC scanners offer MetaMask etc.
  return `${KASPIRE_APP_LINK_BASE}?uri=${encodeURIComponent(uri)}`;
}

export function caip10ToKaspaAddress(caip10: string): string | null {
  const parts = caip10.split(':');
  if (parts.length < 3) return null;
  // kaspa:mainnet:q...
  return `kaspa:${parts.slice(2).join(':')}`;
}

function addressFromSession(session: KaspireSession): string | null {
  const accounts = session.namespaces.kaspa?.accounts ?? [];
  if (!accounts.length) return null;
  return caip10ToKaspaAddress(accounts[0]);
}

function isPublishError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /failed to publish/i.test(msg);
}

/** Soft nudge for the relay socket. Never block pairing for long. */
async function nudgeRelayer(client: KaspireSignClient): Promise<void> {
  const relayer = client.core?.relayer;
  if (!relayer || relayer.connected) return;
  try {
    await Promise.race([
      Promise.resolve(relayer.transportOpen?.()).then(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    /* connect() will surface relay errors */
  }
}

async function getSignClient(): Promise<KaspireSignClient> {
  if (!signClientPromise) {
    signClientPromise = SignClient.init({
      projectId: getProjectId(),
      relayUrl: KASPIRE_RELAY_URL,
      metadata: {
        name: 'Kasparex',
        description: 'Kasparex Hub on Kaspa',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://kasparex.com',
        icons: [
          typeof window !== 'undefined'
            ? `${window.location.origin}/favicon.ico`
            : 'https://kasparex.com/favicon.ico',
        ],
      },
      // Keep Kaspire pairing state separate from EVM RainbowKit WC.
      storageOptions: { database: KASPIRE_WC_STORAGE },
    })
      .then((client) => {
        void nudgeRelayer(client);

        client.on('session_event', ({ params }) => {
          if (params.event.name !== 'accountsChanged') return;
          const data = params.event.data;
          const accounts = Array.isArray(data)
            ? data.map((item) => {
                const raw = String(item);
                return raw.startsWith('kaspa:mainnet:') ? caip10ToKaspaAddress(raw) ?? raw : raw;
              })
            : [];
          accountListeners.forEach((cb) => cb(accounts.filter(Boolean) as string[]));
        });

        client.on('session_delete', ({ topic }) => {
          if (activeSession?.topic === topic) {
            activeSession = null;
            accountListeners.forEach((cb) => cb([]));
          }
        });

        return client;
      })
      .catch((error) => {
        signClientPromise = null;
        throw error;
      });
  }
  return signClientPromise;
}

export function getActiveKaspireSession(): KaspireSession | null {
  return activeSession;
}

/** Cancel an in-flight pairing (modal Cancel / dropdown close). */
export function cancelKaspirePairing(): void {
  const ac = pairingAbort;
  pairingAbort = null;
  try {
    ac?.abort();
  } catch {
    /* ignore */
  }
}

export async function restoreKaspireSession(): Promise<KaspireSession | null> {
  const client = await getSignClient();
  const sessions = client.session.getAll();
  const session = sessions.find((item) => item.namespaces.kaspa?.accounts?.length);
  activeSession = session ?? null;
  return activeSession;
}

async function disconnectAllKaspireSessions(client: KaspireSignClient): Promise<void> {
  const sessions = client.session.getAll().filter((item) => item.namespaces.kaspa?.accounts?.length);
  await Promise.all(
    sessions.map(async (session) => {
      try {
        await client.disconnect({
          topic: session.topic,
          reason: { code: 6000, message: 'Starting a new Kasparex pairing' },
        });
      } catch {
        /* ignore stale sessions */
      }
    }),
  );
  activeSession = null;
}

async function proposeKaspireSession(
  client: KaspireSignClient,
  methods: string[],
  signal: AbortSignal,
): Promise<{ uri: string; approval: () => Promise<KaspireSession> }> {
  throwIfPairingAborted(signal);
  await nudgeRelayer(client);
  throwIfPairingAborted(signal);

  const connectResult = await Promise.race([
    client.connect({
      requiredNamespaces: {
        kaspa: {
          chains: [KASPIRE_CHAIN_ID],
          methods,
          events: [...KASPIRE_EVENTS],
        },
      },
    }),
    new Promise<never>((_, reject) => {
      const onAbort = () => reject(new Error('Kaspire pairing cancelled'));
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
      setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        reject(
          new Error(
            'WalletConnect took too long to create a pairing QR. Check your network and try again.',
          ),
        );
      }, 25_000);
    }),
  ]);

  throwIfPairingAborted(signal);

  const { uri, approval } = connectResult;
  if (!uri) {
    throw new Error('WalletConnect did not return a pairing URI');
  }

  return { uri, approval };
}

export async function connectKaspireSession(options?: {
  onPairingUri?: PairingUriHandler;
  methods?: readonly string[];
}): Promise<{ session: KaspireSession; address: string }> {
  // Cancel any previous attempt so only one pairing runs.
  cancelKaspirePairing();
  const ac = new AbortController();
  pairingAbort = ac;
  const { signal } = ac;

  try {
    const client = await getSignClient();
    throwIfPairingAborted(signal);

    // Always start a fresh pairing so the QR / App Link is shown.
    // Restoring a prior session silently left the modal stuck on "Starting…".
    await disconnectAllKaspireSessions(client);
    throwIfPairingAborted(signal);

    const methods = options?.methods?.length
      ? [...options.methods]
      : [...KASPIRE_METHODS];

    let uri: string;
    let approval: () => Promise<KaspireSession>;

    try {
      ({ uri, approval } = await proposeKaspireSession(client, methods, signal));
    } catch (error) {
      throwIfPairingAborted(signal);
      if (!isPublishError(error)) throw error;
      // Relay hiccup / stale socket: reset client and retry once.
      signClientPromise = null;
      try {
        const retryClient = await getSignClient();
        await disconnectAllKaspireSessions(retryClient);
        ({ uri, approval } = await proposeKaspireSession(retryClient, methods, signal));
      } catch (retryError) {
        throwIfPairingAborted(signal);
        if (isPublishError(retryError)) {
          throw new Error(
            'WalletConnect relay could not publish the pairing. Confirm NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set in Vercel (same ID RainbowKit uses), that this site origin is allowlisted in WalletConnect Cloud / Reown, then try again without VPN.',
          );
        }
        throw retryError;
      }
    }

    throwIfPairingAborted(signal);

    // Never log the pairing URI. Hand it only to the UI / App Link opener.
    options?.onPairingUri?.(uri);

    const session = await new Promise<KaspireSession>((resolve, reject) => {
      const onAbort = () => {
        cleanup();
        reject(new Error('Kaspire pairing cancelled'));
      };
      const cleanup = () => {
        signal.removeEventListener('abort', onAbort);
      };

      if (signal.aborted) {
        reject(new Error('Kaspire pairing cancelled'));
        return;
      }

      signal.addEventListener('abort', onAbort, { once: true });

      void approval()
        .then((s) => {
          cleanup();
          resolve(s);
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    });

    activeSession = session;
    const address = addressFromSession(session);
    if (!address) {
      throw new Error('Kaspire did not return a Kaspa account');
    }
    return { session, address };
  } finally {
    if (pairingAbort === ac) pairingAbort = null;
  }
}

export async function disconnectKaspireSession(): Promise<void> {
  cancelKaspirePairing();
  const client = await getSignClient();
  const session = activeSession ?? (await restoreKaspireSession());
  if (!session) {
    activeSession = null;
    return;
  }
  try {
    await client.disconnect({
      topic: session.topic,
      reason: { code: 6000, message: 'User disconnected' },
    });
  } catch {
    // Session may already be gone.
  }
  activeSession = null;
}

async function kaspireRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const client = await getSignClient();
  const session = activeSession ?? (await restoreKaspireSession());
  if (!session) {
    throw new Error('Kaspire is not connected. Pair the wallet again.');
  }
  return client.request({
    topic: session.topic,
    chainId: KASPIRE_CHAIN_ID,
    request: { method, params },
  }) as Promise<T>;
}

/** Kaspire protocol v2 KRC-20 commit/reveal transfer. Returns reveal tx id when available. */
export async function sendKaspireKrc20(args: {
  to: string;
  ticker: string;
  amount: string;
  from?: string;
}): Promise<string> {
  const from =
    args.from ??
    (activeSession ? addressFromSession(activeSession) : null) ??
    (await restoreKaspireSession().then((s) => (s ? addressFromSession(s) : null)));
  if (!from) {
    throw new Error('Kaspire is not connected. Pair the wallet again.');
  }
  const to = args.to.startsWith('kaspa:') ? args.to : `kaspa:${args.to.replace(/^kaspa:/i, '')}`;
  const result = await kaspireRequest<{
    revealTransactionId?: string;
    commitTransactionId?: string;
    transactionId?: string;
  } | string>('kaspa_sendKrc20', {
    from,
    to,
    ticker: args.ticker.toUpperCase(),
    amount: args.amount,
  });
  if (typeof result === 'string' && result.trim()) return result.trim();
  if (result && typeof result === 'object') {
    const reveal = result.revealTransactionId?.trim();
    const commit = result.commitTransactionId?.trim();
    const tx = result.transactionId?.trim();
    if (reveal) return reveal;
    if (commit) return commit;
    if (tx) return tx;
  }
  throw new Error('Kaspire did not return a KRC-20 transaction id');
}

export function createKaspireAdapter(): KaspaWalletProviderInterface {
  const adapter: KaspaWalletProviderInterface = {
    isConnected(): boolean {
      return Boolean(activeSession?.namespaces.kaspa?.accounts?.length);
    },

    async getAddress(): Promise<string | null> {
      if (!activeSession) {
        await restoreKaspireSession();
      }
      return activeSession ? addressFromSession(activeSession) : null;
    },

    async requestConnection(): Promise<string> {
      const { address } = await connectKaspireSession({
        // Request payment methods up front so Hub multi-out / KRC-20 work after connect.
        methods: [...KASPIRE_METHODS],
      });
      return address;
    },

    async disconnect(): Promise<void> {
      await disconnectKaspireSession();
    },

    async signMessage(message: string): Promise<string> {
      const address = await adapter.getAddress();
      if (!address) throw new Error('Kaspire address unavailable');
      const signature = await kaspireRequest<string>('kaspa_signPersonal', {
        address,
        message,
      });
      if (!signature || typeof signature !== 'string') {
        throw new Error('Kaspire did not return a signature');
      }
      return signature;
    },

    async sendTransaction(transaction: KaspaTransactionRequest): Promise<string> {
      const from = (await adapter.getAddress()) ?? undefined;
      const amountSompi =
        typeof transaction.amount === 'string' || typeof transaction.amount === 'number'
          ? String(transaction.amount)
          : '';
      if (!amountSompi) {
        throw new Error('Missing amount for Kaspire payment');
      }
      const txId = await kaspireRequest<string>('kaspa_sendTransaction', {
        ...(from ? { from } : {}),
        to: transaction.to,
        amountSompi,
      });
      if (!txId || typeof txId !== 'string') {
        throw new Error('Kaspire did not return a transaction id');
      }
      return txId;
    },

    async signPskt(txJsonString: string, options?: {
      signInputs?: Array<{ index: number; sighashType?: number; address?: string; publicKey?: string }>;
      toSignInputs?: Array<{ index: number; address?: string }>;
      autoFinalize?: boolean;
      scripts?: unknown[];
    }): Promise<string> {
      const signed = await kaspireRequest<string>('kaspa_signPskt', {
        txJsonString,
        options: {
          signInputs: options?.signInputs ?? [],
          ...(options?.autoFinalize != null ? { autoFinalize: options.autoFinalize } : {}),
        },
      });
      if (!signed || typeof signed !== 'string') {
        throw new Error('Kaspire kaspa_signPskt returned an empty result');
      }
      return signed;
    },

    on(event: 'accountsChanged', callback: (accounts: string[]) => void): void {
      if (event === 'accountsChanged') accountListeners.add(callback);
    },

    removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void {
      if (event === 'accountsChanged') accountListeners.delete(callback);
    },
  };
  return adapter;
}

export function isAndroidUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIosUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
