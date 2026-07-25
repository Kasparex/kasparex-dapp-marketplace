/**
 * Kaspire WalletConnect v2 (Kaspire protocol v2) adapter for Kaspa L1.
 * @see https://kaspire.kaslab.space/developers
 */

import { SignClient } from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import type { KaspaTransactionRequest, KaspaWalletProviderInterface } from './types';

export const KASPIRE_CHAIN_ID = 'kaspa:mainnet';
export const KASPIRE_APP_LINK_BASE = 'https://kaspire.kaslab.space/kaspire/wc';
export const KASPIRE_DOWNLOAD_URL = 'https://kaspire.kaslab.space/';
export const KASPIRE_DOCS_URL = 'https://kaspire.kaslab.space/developers';

const KASPIRE_METHODS = [
  'kaspa_getAccounts',
  'kaspa_signPersonal',
  'kaspa_sendTransaction',
  'kaspa_sendKrc20',
  'kaspa_sendKcc20',
] as const;

const KASPIRE_EVENTS = ['accountsChanged'] as const;

type PairingUriHandler = (uri: string) => void;

type KaspireSignClient = Awaited<ReturnType<typeof SignClient.init>>;

let signClientPromise: Promise<KaspireSignClient> | null = null;
let activeSession: SessionTypes.Struct | null = null;
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

function addressFromSession(session: SessionTypes.Struct): string | null {
  const accounts = session.namespaces.kaspa?.accounts ?? [];
  if (!accounts.length) return null;
  return caip10ToKaspaAddress(accounts[0]);
}

async function getSignClient(): Promise<KaspireSignClient> {
  if (!signClientPromise) {
    signClientPromise = SignClient.init({
      projectId: getProjectId(),
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
    }).then((client) => {
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
    });
  }
  return signClientPromise;
}

export function getActiveKaspireSession(): SessionTypes.Struct | null {
  return activeSession;
}

export async function restoreKaspireSession(): Promise<SessionTypes.Struct | null> {
  const client = await getSignClient();
  const sessions = client.session.getAll();
  const session = sessions.find((item) => item.namespaces.kaspa?.accounts?.length);
  activeSession = session ?? null;
  return activeSession;
}

export async function connectKaspireSession(options?: {
  onPairingUri?: PairingUriHandler;
  methods?: readonly string[];
}): Promise<{ session: SessionTypes.Struct; address: string }> {
  const client = await getSignClient();

  const existing = await restoreKaspireSession();
  if (existing) {
    const address = addressFromSession(existing);
    if (address) return { session: existing, address };
  }

  const methods = options?.methods?.length
    ? [...options.methods]
    : [...KASPIRE_METHODS];

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

  // Never log the pairing URI. Hand it only to the UI / App Link opener.
  options?.onPairingUri?.(uri);

  const session = await approval();
  activeSession = session;
  const address = addressFromSession(session);
  if (!address) {
    throw new Error('Kaspire did not return a Kaspa account');
  }
  return { session, address };
}

export async function disconnectKaspireSession(): Promise<void> {
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
