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
let pairingCancel: ((reason?: Error) => void) | null = null;
const accountListeners = new Set<(accounts: string[]) => void>();

function getProjectId(): string {
  const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  if (!id) {
    throw new Error(
      'WalletConnect project ID is missing. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to connect Kaspire.',
    );
  }
  return id;
}

export function buildKaspireAppLink(uri: string): string {
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

async function ensureRelayerConnected(client: KaspireSignClient): Promise<void> {
  const relayer = client.core?.relayer;
  if (!relayer) return;
  if (relayer.connected) return;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'WalletConnect relay did not connect. Check your network, disable VPN if needed, and try again.',
        ),
      );
    }, 20_000);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        relayer.events?.removeListener?.('relayer_connect', onConnect);
        // Older SDKs use EventEmitter-style off/once.
        (relayer as { off?: (e: string, cb: () => void) => void }).off?.('relayer_connect', onConnect);
      } catch {
        /* ignore */
      }
    };

    try {
      relayer.once?.('relayer_connect', onConnect);
    } catch {
      relayer.events?.once?.('relayer_connect', onConnect);
    }

    void Promise.resolve(relayer.transportOpen?.()).catch(() => {
      /* transportOpen may already be in progress */
    });

    if (relayer.connected) {
      cleanup();
      resolve();
    }
  });
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
      .then(async (client) => {
        try {
          await ensureRelayerConnected(client);
        } catch {
          // Still attach listeners; connect() will retry relay.
        }

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

/** Cancel an in-flight pairing (modal Cancel). */
export function cancelKaspirePairing(): void {
  const cancel = pairingCancel;
  pairingCancel = null;
  cancel?.(new Error('Kaspire pairing cancelled'));
}

export async function restoreKaspireSession(): Promise<KaspireSession | null> {
  const client = await getSignClient();
  const sessions = client.session.getAll();
  const session = sessions.find((item) => item.namespaces.kaspa?.accounts?.length);
  activeSession = session ?? null;
  return activeSession;
}

async function proposeKaspireSession(
  client: KaspireSignClient,
  methods: string[],
): Promise<{ uri: string; approval: () => Promise<KaspireSession> }> {
  await ensureRelayerConnected(client);

  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      kaspa: {
        chains: [KASPIRE_CHAIN_ID],
        methods,
        events: [...KASPIRE_EVENTS],
      },
    },
  });

  if (!uri) {
    throw new Error('WalletConnect did not return a pairing URI');
  }

  return { uri, approval };
}

export async function connectKaspireSession(options?: {
  onPairingUri?: PairingUriHandler;
  methods?: readonly string[];
}): Promise<{ session: KaspireSession; address: string }> {
  const client = await getSignClient();

  const existing = await restoreKaspireSession();
  if (existing) {
    const address = addressFromSession(existing);
    if (address) return { session: existing, address };
  }

  const methods = options?.methods?.length
    ? [...options.methods]
    : [...KASPIRE_METHODS];

  let uri: string;
  let approval: () => Promise<KaspireSession>;

  try {
    ({ uri, approval } = await proposeKaspireSession(client, methods));
  } catch (error) {
    if (!isPublishError(error)) throw error;
    // Relay hiccup / stale socket: reset client and retry once.
    signClientPromise = null;
    try {
      const retryClient = await getSignClient();
      ({ uri, approval } = await proposeKaspireSession(retryClient, methods));
    } catch (retryError) {
      if (isPublishError(retryError)) {
        throw new Error(
          'WalletConnect relay could not publish the pairing. Check your network or VPN, confirm your Reown project ID allowlists this site origin, then try again.',
        );
      }
      throw retryError;
    }
  }

  // Never log the pairing URI. Hand it only to the UI / App Link opener.
  options?.onPairingUri?.(uri);

  const session = await new Promise<KaspireSession>((resolve, reject) => {
    pairingCancel = (reason) => {
      pairingCancel = null;
      reject(reason ?? new Error('Kaspire pairing cancelled'));
    };
    void approval()
      .then((s) => {
        pairingCancel = null;
        resolve(s);
      })
      .catch((err) => {
        pairingCancel = null;
        reject(err);
      });
  });

  activeSession = session;
  const address = addressFromSession(session);
  if (!address) {
    throw new Error('Kaspire did not return a Kaspa account');
  }
  return { session, address };
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
        methods: ['kaspa_getAccounts', 'kaspa_signPersonal'],
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
