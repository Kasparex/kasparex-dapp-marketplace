/**
 * Native Kaspa Wallet Connector
 * 
 * Handles detection and connection to native Kaspa wallets
 */

import type {
  KaspaWalletProvider,
  KaspaWalletState,
  KaspaWalletProviderInfo,
  KaspaWalletProviderInterface,
  WindowWithKaspa,
  KaspaAddress,
  KaspaTransactionRequest,
  KaspaTransactionResponse,
  CovenantTxRequest,
  CovenantTxResult,
  CovenantCapabilities,
} from './types';
import { extractKaspaTransactionId } from './transactionId';
import { formatKaspaWalletError } from './formatWalletError';
import { 
  isValidKaspaAddress as sdkIsValidKaspaAddress,
  normalizeKaspaAddress as sdkNormalizeKaspaAddress,
  formatKaspaAddress as sdkFormatKaspaAddress,
} from './sdk';
import type { SIWKAuthResult } from './auth';
import { isKasWareConnected } from './kasware';
import { createKaspireAdapter } from './kaspireWc';

const WALLET_RPC_TIMEOUT_MS = 90_000;

function withWalletCallTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out. Your wallet may be waiting for approval or the RPC connection may be down. Open your wallet extension and retry.`,
        ),
      );
    }, WALLET_RPC_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function parseSompiAmount(amount: string | number): number {
  const sompi = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  if (!Number.isFinite(sompi) || sompi <= 0) {
    throw new Error('Invalid transaction amount');
  }
  return sompi;
}

function buildKasSendOptions(transaction: KaspaTransactionRequest): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  if (transaction.fee != null && transaction.fee !== '' && transaction.fee !== '0') {
    options.priorityFee =
      typeof transaction.fee === 'string' ? parseFloat(transaction.fee) : transaction.fee;
  }
  if (transaction.note != null && transaction.note !== '') {
    options.note = transaction.note;
  }
  if (transaction.payload != null && transaction.payload !== '') {
    options.payload = transaction.payload;
  }
  return options;
}

async function invokeKasWareSend(
  kasware: Record<string, unknown>,
  transaction: KaspaTransactionRequest,
): Promise<string> {
  const toAddress = sdkNormalizeKaspaAddress(transaction.to);
  const sompi = parseSompiAmount(transaction.amount);
  const options = buildKasSendOptions(transaction);

  if (typeof kasware.sendKaspa === 'function') {
    return withWalletCallTimeout(
      kasware.sendKaspa(toAddress, sompi, options) as Promise<string>,
      'KAS transfer',
    );
  }

  if (typeof kasware.sendTransaction === 'function') {
    return withWalletCallTimeout(
      (kasware.sendTransaction as (tx: KaspaTransactionRequest) => Promise<string>)({
        ...transaction,
        to: toAddress,
        amount: String(sompi),
      }),
      'KAS transfer',
    );
  }

  throw new Error('KasWare sendKaspa is not available. Update your KasWare extension.');
}

async function invokeKastleSend(
  kastle: Record<string, unknown>,
  transaction: KaspaTransactionRequest,
): Promise<string> {
  const toAddress = sdkNormalizeKaspaAddress(transaction.to);
  const sompi = parseSompiAmount(transaction.amount);
  const options = buildKasSendOptions(transaction);

  if (typeof kastle.sendKaspa === 'function') {
    return withWalletCallTimeout(
      kastle.sendKaspa(toAddress, sompi, options) as Promise<string>,
      'KAS transfer',
    );
  }

  if (typeof kastle.request === 'function') {
    return withWalletCallTimeout(
      (kastle.request as (method: string, params?: unknown) => Promise<string>)('kas:send_kaspa', {
        to: toAddress,
        amount: sompi,
        ...options,
      }),
      'KAS transfer',
    );
  }

  throw new Error('Kastle sendKaspa is not available. Update your Kastle extension.');
}

/**
 * List of supported wallet providers with metadata
 */
export const KASPA_WALLET_PROVIDERS: Record<KaspaWalletProvider, Omit<KaspaWalletProviderInfo, 'isInstalled'>> = {
  kasware: {
    id: 'kasware',
    name: 'KasWare',
    downloadUrl: 'https://chrome.google.com/webstore/detail/hklhheigdmpoolooomdihmhlpjjdbklf',
    documentationUrl: 'https://docs.kasware.xyz/wallet/',
  },
  kastle: {
    id: 'kastle',
    name: 'Kastle',
    downloadUrl: 'https://kastle.cc/',
    documentationUrl: 'https://docs.kastle.cc/',
  },
  kaspire: {
    id: 'kaspire',
    name: 'Kaspire',
    icon: '/img/logos/kaspire.png',
    downloadUrl: 'https://kaspire.kaslab.space/',
    documentationUrl: 'https://kaspire.kaslab.space/developers',
  },
  kaspium: {
    id: 'kaspium',
    name: 'Kaspium',
    downloadUrl: 'https://kaspium.app',
    documentationUrl: 'https://docs.kaspium.app',
  },
  okx: {
    id: 'okx',
    name: 'OKX Wallet',
    downloadUrl: 'https://www.okx.com/web3',
    documentationUrl: 'https://www.okx.com/support',
  },
  safepal: {
    id: 'safepal',
    name: 'SafePal',
    downloadUrl: 'https://www.safepal.com',
    documentationUrl: 'https://docs.safepal.com',
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
  },
};

/**
 * Get window object with Kaspa wallet types
 */
function getWindow(): WindowWithKaspa {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }
  return window as WindowWithKaspa;
}

/**
 * Detect installed Kaspa wallet providers
 */
export function detectKaspaWallets(): KaspaWalletProviderInfo[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const win = getWindow();
  const providers: KaspaWalletProviderInfo[] = [];

  // Check KasWare - check for window.kasware
  if (win.kasware) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kasware,
      isInstalled: true,
    });
  }

  // Check Kastle - check for window.kastle
  if ((win as any).kastle) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kastle,
      isInstalled: true,
    });
  }

  // Check Kaspium
  if (win.kaspium) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kaspium,
      isInstalled: true,
    });
  }

  // Check OKX
  if (win.okx?.kaspa) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.okx,
      isInstalled: true,
    });
  }

  // Check SafePal
  if (win.safepal?.kaspa) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.safepal,
      isInstalled: true,
    });
  }

  return providers;
}

/**
 * Get wallet provider interface by provider ID
 */
/**
 * Extended wallet provider interface with balance support
 */
interface ExtendedWalletProviderInterface extends KaspaWalletProviderInterface {
  getBalance?: () => Promise<string | number | { balance: string | number } | null>;
}

function synthesizeCovenantCapabilities(
  adapter: ExtendedWalletProviderInterface,
): CovenantCapabilities {
  const hasNative = typeof adapter.sendCovenantTransaction === 'function';
  const canSign = typeof adapter.signPskt === 'function';
  const canBroadcast = typeof adapter.pushTx === 'function';
  return {
    txV1: hasNative || canSign,
    covenantBindings: hasNative || canSign,
    canSendCovenantTx: hasNative || (canSign && canBroadcast),
    canSignCovenantPskt: canSign,
    canBroadcastSignedTx: canBroadcast,
    hasNativeCovenantSubmit: hasNative,
  };
}

function mergeReportedCovenantCapabilities(
  caps: Record<string, unknown>,
  adapter: ExtendedWalletProviderInterface,
): CovenantCapabilities {
  const synthesized = synthesizeCovenantCapabilities(adapter);
  return {
    txV1: Boolean(caps.txV1 ?? synthesized.txV1),
    covenantBindings: Boolean(caps.covenantBindings ?? synthesized.covenantBindings),
    canSendCovenantTx: Boolean(caps.canSendCovenantTx ?? synthesized.canSendCovenantTx),
    canSignCovenantPskt: Boolean(caps.canSignCovenantPskt ?? synthesized.canSignCovenantPskt),
    canBroadcastSignedTx: Boolean(caps.canBroadcastSignedTx ?? synthesized.canBroadcastSignedTx),
    hasNativeCovenantSubmit: Boolean(
      caps.hasNativeCovenantSubmit ?? synthesized.hasNativeCovenantSubmit,
    ),
  };
}

function normalizeCovenantTxResult(raw: unknown): CovenantTxResult {
  if (typeof raw === 'string') {
    const txHash = extractKaspaTransactionId(raw) ?? raw;
    return { txHash, status: 'pending' };
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const txHash =
      extractKaspaTransactionId(
        (o.txHash ?? o.txId ?? o.transactionId ?? o.hash) as string | undefined
      ) ?? '';
    const status =
      o.status === 'failed' || o.status === 'confirmed' || o.status === 'pending'
        ? o.status
        : txHash
          ? 'pending'
          : 'failed';
    const outpointRaw = o.outpoint as Record<string, unknown> | undefined;
    const outpoint =
      outpointRaw && typeof outpointRaw.txId === 'string'
        ? {
            txId: outpointRaw.txId,
            index: Number(outpointRaw.index ?? 0),
          }
        : undefined;
    const covenantId =
      typeof o.covenantId === 'string'
        ? o.covenantId
        : typeof o.covenant_id === 'string'
          ? o.covenant_id
          : undefined;
    return {
      txHash,
      status,
      error: typeof o.error === 'string' ? o.error : undefined,
      outpoint,
      covenantId,
    };
  }
  return {
    txHash: '',
    status: 'failed',
    error: 'Wallet returned an invalid covenant transaction response',
  };
}

/** Public alias for programmability capability checks. */
export function getWalletProviderInterface(
  provider: KaspaWalletProvider
): KaspaWalletProviderInterface | null {
  return getWalletProvider(provider);
}

/**
 * Create adapter for KasWare wallet to match SDK interface
 */
function createKasWareAdapter(kasware: any): ExtendedWalletProviderInterface {
  const adapter: ExtendedWalletProviderInterface = {
    isConnected: () => {
      if (typeof kasware.isConnected === 'function') {
        const connected = kasware.isConnected();
        console.log('KasWare isConnected check:', connected);
        return connected;
      }
      return isKasWareConnected();
    },
    getAddress: async () => {
      if (typeof kasware.getAddress === 'function') {
        const addr = await kasware.getAddress();
        if (addr) return addr;
      }
      // KasWare may return null from getAddress() while sendKaspa still works after requestAccounts().
      if (typeof kasware.requestAccounts === 'function') {
        const accounts = await kasware.requestAccounts();
        if (Array.isArray(accounts) && accounts.length > 0) {
          return accounts[0];
        }
      }
      return null;
    },
    requestConnection: async () => {
      if (typeof kasware.requestAccounts === 'function') {
        const accounts = await kasware.requestAccounts();
        if (accounts && accounts.length > 0) {
          return accounts[0];
        }
      }
      throw new Error('Failed to request connection');
    },
    disconnect: async () => {
      if (typeof kasware.disconnect === 'function') {
        await kasware.disconnect();
      }
    },
    signMessage: async (message: string) => {
      if (typeof kasware.signMessage === 'function') {
        return await kasware.signMessage(message);
      }
      throw new Error('signMessage not available');
    },
    sendTransaction: async (transaction: KaspaTransactionRequest) => {
      return invokeKasWareSend(kasware as Record<string, unknown>, transaction);
    },
    on: (event: 'accountsChanged', callback: (accounts: string[]) => void) => {
      if (typeof kasware.on === 'function') {
        kasware.on(event, callback);
      }
    },
    removeListener: (event: 'accountsChanged', callback: (accounts: string[]) => void) => {
      if (typeof kasware.removeListener === 'function') {
        kasware.removeListener(event, callback);
      }
    },
  };

  // Add getBalance if available
  // KasWare API: getBalance() returns Promise<string | number | { balance: string | number } | null>
  if (typeof kasware.getBalance === 'function') {
    adapter.getBalance = async () => {
      try {
        console.log('Calling kasware.getBalance()...');
        const result = await kasware.getBalance();
        console.log('KasWare getBalance() result:', result);
        return result;
      } catch (error) {
        console.error('KasWare getBalance() error:', error);
        throw error;
      }
    };
  } else {
    console.log('KasWare getBalance() method not available');
  }

  if (typeof kasware.sendCovenantTransaction === 'function') {
    adapter.sendCovenantTransaction = async (request) =>
      normalizeCovenantTxResult(await kasware.sendCovenantTransaction(request));
  }

  if (typeof kasware.getPublicKey === 'function') {
    adapter.getPublicKey = async () => {
      try {
        const pk = await kasware.getPublicKey();
        return typeof pk === 'string' && pk.trim() ? pk.trim() : null;
      } catch {
        return null;
      }
    };
  }

  if (typeof kasware.signPskt === 'function') {
    adapter.signPskt = async (txJsonString, options) =>
      kasware.signPskt({ txJsonString, options });
  }

  if (typeof kasware.pushTx === 'function') {
    adapter.pushTx = async (signedTxJson) => {
      const raw = await kasware.pushTx(signedTxJson);
      return extractKaspaTransactionId(raw) ?? String(raw ?? '');
    };
  }

  adapter.getCovenantCapabilities = async () => {
    if (typeof kasware.getCovenantCapabilities === 'function') {
      try {
        const caps = await kasware.getCovenantCapabilities();
        if (caps && typeof caps === 'object') {
          return mergeReportedCovenantCapabilities(caps as Record<string, unknown>, adapter);
        }
      } catch {
        // synthesize below
      }
    }
    return synthesizeCovenantCapabilities(adapter);
  };

  return adapter;
}

function createKastleAdapter(kastle: any): ExtendedWalletProviderInterface {
  const adapter: ExtendedWalletProviderInterface = {
    isConnected: () => {
      if (typeof kastle.isConnected === 'function') {
        try {
          return Boolean(kastle.isConnected());
        } catch {
          return true;
        }
      }
      return true;
    },
    getAddress: async () => {
      if (typeof kastle.getAccount === 'function') {
        const acc = await kastle.getAccount();
        return acc?.address || null;
      }
      if (typeof kastle.request === 'function') {
        const r = await kastle.request('kas:get_account');
        if (r && typeof r === 'object' && 'address' in (r as any)) {
          return (r as any).address || null;
        }
      }
      if (typeof kastle.getAddress === 'function') {
        return await kastle.getAddress();
      }
      if (typeof kastle.requestAccounts === 'function') {
        const accounts = await kastle.requestAccounts();
        return Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
      }
      return null;
    },
    requestConnection: async () => {
      if (typeof kastle.connect === 'function') {
        const ok = await kastle.connect();
        if (!ok) throw new Error('Kastle connection rejected');
      } else if (typeof kastle.request === 'function') {
        const ok = await kastle.request('kas:connect');
        if (ok === false) throw new Error('Kastle connection rejected');
      } else if (typeof kastle.requestAccounts === 'function') {
        const accounts = await kastle.requestAccounts();
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error('No accounts returned from Kastle');
        }
      } else {
        throw new Error('Kastle wallet API not available');
      }

      const addr = await adapter.getAddress();
      if (!addr) throw new Error('Failed to get address from Kastle');
      return addr;
    },
    disconnect: async () => {
      if (typeof kastle.disconnect === 'function') {
        await kastle.disconnect();
      }
    },
    signMessage: async (message: string) => {
      if (typeof kastle.signMessage === 'function') {
        return await kastle.signMessage(message);
      }
      if (typeof kastle.request === 'function') {
        const sig = await kastle.request('kas:sign_message', message);
        if (typeof sig === 'string') return sig;
      }
      throw new Error('signMessage not available');
    },
    sendTransaction: async (transaction: KaspaTransactionRequest) => {
      return invokeKastleSend(kastle as Record<string, unknown>, transaction);
    },
    on: (event: 'accountsChanged', callback: (accounts: string[]) => void) => {
      if (typeof kastle.on === 'function') {
        kastle.on(event, callback);
      }
    },
    removeListener: (event: 'accountsChanged', callback: (accounts: string[]) => void) => {
      if (typeof kastle.removeListener === 'function') {
        kastle.removeListener(event, callback);
      }
    },
  };

  if (typeof kastle.getBalance === 'function') {
    adapter.getBalance = async () => await kastle.getBalance();
  }

  if (typeof kastle.sendCovenantTransaction === 'function') {
    adapter.sendCovenantTransaction = async (request) =>
      normalizeCovenantTxResult(await kastle.sendCovenantTransaction(request));
  }

  if (typeof kastle.getPublicKey === 'function') {
    adapter.getPublicKey = async () => {
      try {
        const pk = await kastle.getPublicKey();
        return typeof pk === 'string' && pk.trim() ? pk.trim() : null;
      } catch {
        return null;
      }
    };
  } else if (typeof kastle.request === 'function') {
    adapter.getPublicKey = async () => {
      try {
        const pk = await kastle.request('kas:get_public_key');
        return typeof pk === 'string' && pk.trim() ? pk.trim() : null;
      } catch {
        return null;
      }
    };
  }

  if (typeof kastle.signPskt === 'function') {
    adapter.signPskt = async (txJsonString, options) => kastle.signPskt(txJsonString, options);
  } else if (typeof kastle.request === 'function') {
    adapter.signPskt = async (txJsonString, options) => {
      const networkId =
        typeof kastle.getNetwork === 'function'
          ? await kastle.getNetwork()
          : await kastle.request('kas:get_network').catch(() => 'mainnet');
      const optionScripts = Array.isArray(options?.scripts)
        ? (options!.scripts as Array<{ inputIndex?: number; index?: number; scriptHex?: string; signType?: number }>).map(
            (s) => ({
              inputIndex: Number(s.inputIndex ?? s.index ?? 0),
              scriptHex: typeof s.scriptHex === 'string' ? s.scriptHex : '',
              signType: s.signType ?? 1,
            }),
          )
        : undefined;
      const scripts =
        optionScripts ??
        (Array.isArray(options?.signInputs)
          ? options!.signInputs!.map((input) => ({
              inputIndex: input.index,
              scriptHex: '',
              signType: input.sighashType ?? 1,
            }))
          : Array.isArray(options?.toSignInputs)
            ? options!.toSignInputs!.map((input) => ({
                inputIndex: input.index,
                scriptHex: '',
                signType: 1,
              }))
            : undefined);
      const signed = await kastle.request('kas:sign_tx', {
        networkId,
        txJson: txJsonString,
        scripts,
      });
      if (typeof signed !== 'string' || !signed.trim()) {
        throw new Error('Kastle kas:sign_tx returned an empty result');
      }
      return signed;
    };
  }

  if (typeof kastle.pushTx === 'function') {
    adapter.pushTx = async (signedTxJson) => {
      const raw = await kastle.pushTx(signedTxJson);
      return extractKaspaTransactionId(raw) ?? String(raw ?? '');
    };
  } else if (typeof kastle.request === 'function') {
    adapter.pushTx = async (signedTxJson) => {
      const networkId =
        typeof kastle.getNetwork === 'function'
          ? await kastle.getNetwork()
          : await kastle.request('kas:get_network').catch(() => 'mainnet');
      // Prefer broadcast-only methods; fall back to sign-and-broadcast of an already-signed tx.
      for (const method of ['kas:broadcast_tx', 'kas:submit_tx', 'kas:push_tx'] as const) {
        try {
          const raw = await kastle.request(method, { networkId, txJson: signedTxJson });
          const id = extractKaspaTransactionId(raw) ?? (typeof raw === 'string' ? raw : '');
          if (id) return id;
        } catch {
          // try next
        }
      }
      const raw = await kastle.request('kas:sign_and_broadcast_tx', {
        networkId,
        txJson: signedTxJson,
      });
      return extractKaspaTransactionId(raw) ?? String(raw ?? '');
    };
  }

  adapter.getCovenantCapabilities = async () => {
    if (typeof kastle.getCovenantCapabilities === 'function') {
      try {
        const caps = await kastle.getCovenantCapabilities();
        if (caps && typeof caps === 'object') {
          return mergeReportedCovenantCapabilities(caps as Record<string, unknown>, adapter);
        }
      } catch {
        // synthesize below
      }
    }
    return synthesizeCovenantCapabilities(adapter);
  };

  return adapter;
}

export function getWalletProvider(provider: KaspaWalletProvider): ExtendedWalletProviderInterface | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = getWindow();

  switch (provider) {
    case 'kasware': {
      const kasware = win.kasware;
      if (!kasware) return null;
      // Create adapter for KasWare to match SDK interface
      return createKasWareAdapter(kasware);
    }
    case 'kastle': {
      const kastle = (win as any).kastle;
      if (!kastle) return null;
      return createKastleAdapter(kastle);
    }
    case 'kaspire':
      return createKaspireAdapter();
    case 'kaspium':
      return win.kaspium || null;
    case 'okx':
      return win.okx?.kaspa || null;
    case 'safepal':
      return win.safepal?.kaspa || null;
    default:
      return null;
  }
}

/**
 * Connect to a Kaspa wallet
 * 
 * @param provider - Wallet provider to connect to
 * @param options - Connection options
 * @param options.enableSIWK - Enable Sign-In with Kaspa authentication (default: false)
 * @param options.siwkParams - Optional SIWK parameters if enableSIWK is true
 * @returns Wallet connection state
 */
export async function connectKaspaWallet(
  provider: KaspaWalletProvider,
  options?: {
    enableSIWK?: boolean;
    siwkParams?: {
      domain?: string;
      statement?: string;
      appName?: string;
    };
    /** Kaspire WalletConnect: receive pairing URI for QR / App Link (never log it). */
    onPairingUri?: (uri: string) => void;
  }
): Promise<KaspaWalletState & { siwkAuth?: SIWKAuthResult }> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Window is not available');
    }

    const win = getWindow();
    let address: string | null = null;

    // Handle different wallet providers with their specific APIs
    switch (provider) {
      case 'kaspire': {
        const { connectKaspireSession } = await import('./kaspireWc');
        const methods =
          options?.enableSIWK === false
            ? (['kaspa_getAccounts', 'kaspa_sendTransaction'] as const)
            : (['kaspa_getAccounts', 'kaspa_signPersonal', 'kaspa_sendTransaction'] as const);
        const paired = await connectKaspireSession({
          onPairingUri: options?.onPairingUri,
          methods,
        });
        address = paired.address;
        break;
      }

      case 'kasware': {
        if (!win.kasware) {
          throw new Error('KasWare wallet is not installed');
        }
        
        // KasWare API: requestAccounts() returns Promise<string[]>
        // Documentation: https://docs.kasware.xyz/wallet/dev-base/kaspa
        const kasware = win.kasware as any;
        
        if (typeof kasware.requestAccounts === 'function') {
          console.log('Calling kasware.requestAccounts()...');
          const accounts = await kasware.requestAccounts();
          console.log('KasWare requestAccounts() result:', accounts);
          
          if (Array.isArray(accounts) && accounts.length > 0) {
            address = accounts[0];
            console.log('Selected address:', address);
            
            // Verify wallet is connected after requestAccounts (but don't fail if method doesn't exist)
            if (typeof kasware.isConnected === 'function') {
              const isConnected = kasware.isConnected();
              console.log('Wallet isConnected check after requestAccounts:', isConnected);
              // Don't throw error if isConnected returns false - requestAccounts() success is sufficient
              if (!isConnected) {
                console.warn('KasWare isConnected() returned false, but requestAccounts() succeeded. Continuing with connection.');
              }
            } else {
              console.log('KasWare isConnected() method not available, trusting requestAccounts() result');
            }
          } else {
            throw new Error('No accounts returned from KasWare wallet');
          }
        } else {
          throw new Error('KasWare wallet API not available. Please update your KasWare extension.');
        }
        break;
      }

      case 'kastle': {
        const kastle = (win as any).kastle;
        if (!kastle) {
          throw new Error('Kastle wallet is not installed');
        }

        if (typeof kastle.connect === 'function') {
          const ok = await kastle.connect();
          if (!ok) throw new Error('Kastle connection rejected');
        } else if (typeof kastle.request === 'function') {
          const ok = await kastle.request('kas:connect');
          if (ok === false) throw new Error('Kastle connection rejected');
        } else if (typeof kastle.requestAccounts === 'function') {
          const accounts = await kastle.requestAccounts();
          if (!Array.isArray(accounts) || accounts.length === 0) {
            throw new Error('No accounts returned from Kastle wallet');
          }
        } else {
          throw new Error('Kastle wallet API not available. Please update your Kastle extension.');
        }

        if (typeof kastle.getAccount === 'function') {
          const acc = await kastle.getAccount();
          address = acc?.address || null;
        } else if (typeof kastle.request === 'function') {
          const r = await kastle.request('kas:get_account');
          address =
            r && typeof r === 'object' && 'address' in (r as any) ? (r as any).address : null;
        } else if (typeof kastle.getAddress === 'function') {
          address = await kastle.getAddress();
        } else if (typeof kastle.requestAccounts === 'function') {
          const accounts = await kastle.requestAccounts();
          address = Array.isArray(accounts) ? accounts[0] : null;
        }

        break;
      }

      case 'kaspium': {
        if (!win.kaspium) {
          throw new Error('Kaspium wallet is not installed');
        }
        const kaspium = win.kaspium as any;
        if (typeof kaspium.request === 'function') {
          const result = await kaspium.request({ method: 'kaspa_requestAccounts' });
          address = Array.isArray(result) ? result[0] : result?.address || result?.accounts?.[0];
        } else if (typeof kaspium.getAddress === 'function') {
          address = await kaspium.getAddress();
        }
        break;
      }

      case 'okx': {
        if (!win.okx?.kaspa) {
          throw new Error('OKX Kaspa wallet is not installed');
        }
        const okxKaspa = win.okx.kaspa as any;
        if (typeof okxKaspa.request === 'function') {
          const result = await okxKaspa.request({ method: 'kaspa_requestAccounts' });
          address = Array.isArray(result) ? result[0] : result?.address || result?.accounts?.[0];
        }
        break;
      }

      case 'safepal': {
        if (!win.safepal?.kaspa) {
          throw new Error('SafePal Kaspa wallet is not installed');
        }
        const safepalKaspa = win.safepal.kaspa as any;
        if (typeof safepalKaspa.request === 'function') {
          const result = await safepalKaspa.request({ method: 'kaspa_requestAccounts' });
          address = Array.isArray(result) ? result[0] : result?.address || result?.accounts?.[0];
        }
        break;
      }

      default:
        throw new Error(`Unsupported wallet provider: ${provider}`);
    }

    if (!address) {
      throw new Error('Failed to get address from wallet. Please ensure the wallet is unlocked and try again.');
    }

    // Validate address using SDK
    if (!sdkIsValidKaspaAddress(address)) {
      throw new Error('Invalid Kaspa address returned from wallet');
    }

    // Normalize address using SDK (ensure kaspa: prefix)
    const normalizedAddress = sdkNormalizeKaspaAddress(address);

    // SIWK authentication (required when enabled)
    let siwkAuth: SIWKAuthResult | undefined;
    if (options?.enableSIWK !== false) {
      try {
        const { signInWithKaspa } = await import('./auth');
        const domain = options?.siwkParams?.domain || (typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com');
        const appName = options?.siwkParams?.appName || 'Kasparex dApps';

        siwkAuth = await signInWithKaspa(provider, {
          domain,
          address: normalizedAddress,
          statement: options?.siwkParams?.statement || `Welcome to ${appName}!`,
        });
      } catch (siwkError) {
        try {
          await disconnectKaspaWallet(provider);
        } catch {
          /* ignore disconnect errors */
        }
        const message =
          siwkError instanceof Error ? siwkError.message : 'Sign-in with Kaspa failed';
        throw new Error(message);
      }
    }

    return {
      isConnected: true,
      address: normalizedAddress,
      provider,
      error: null,
      ...(siwkAuth && { siwkAuth }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isConnected: false,
      address: null,
      provider: null,
      error: errorMessage,
    };
  }
}

/**
 * Disconnect from a Kaspa wallet
 */
export async function disconnectKaspaWallet(
  provider: KaspaWalletProvider
): Promise<void> {
  try {
    if (provider === 'kaspire') {
      const { disconnectKaspireSession } = await import('./kaspireWc');
      await disconnectKaspireSession();
      return;
    }

    const walletProvider = getWalletProvider(provider);
    
    if (walletProvider && walletProvider.isConnected()) {
      await walletProvider.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

/**
 * Get current connected address
 */
export async function getKaspaAddress(
  provider: KaspaWalletProvider,
  options?: { sessionRestore?: boolean },
): Promise<string | null> {
  try {
    const walletProvider = getWalletProvider(provider);

    if (!walletProvider) {
      return null;
    }

    if (!options?.sessionRestore && !walletProvider.isConnected()) {
      return null;
    }

    const address = await walletProvider.getAddress();
    
    if (!address) {
      return null;
    }

    // Validate and normalize address using SDK
    if (!sdkIsValidKaspaAddress(address)) {
      console.error('Invalid address returned from wallet');
      return null;
    }

    return sdkNormalizeKaspaAddress(address);
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
}

/**
 * Format Kaspa address for display
 * Uses SDK utilities for consistent formatting
 */
export function formatKaspaAddress(
  address: string,
  options: { startChars?: number; endChars?: number } = {}
): KaspaAddress {
  // Use SDK formatting
  const formatted = sdkFormatKaspaAddress(address, options);
  
  return {
    full: formatted.full,
    short: formatted.short,
    display: formatted.display,
  };
}

/**
 * Validate Kaspa address format
 * Uses SDK validation for standardized checking
 * 
 * @deprecated Use isValidKaspaAddress from './sdk' directly for new code
 */
export function isValidKaspaAddress(address: string): boolean {
  return sdkIsValidKaspaAddress(address);
}

/**
 * Sign a message with Kaspa wallet
 */
export async function signKaspaMessage(
  provider: KaspaWalletProvider,
  message: string
): Promise<string> {
  const walletProvider = getWalletProvider(provider);

  if (!walletProvider) {
    throw new Error('Wallet provider not available');
  }

  // Do not gate on isConnected(): KasWare may return false right after requestAccounts().
  try {
    return await walletProvider.signMessage(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to sign message: ${errorMessage}`);
  }
}

/**
 * Send a covenant (tx v1) transaction via Kaspa wallet when supported.
 */
export async function sendCovenantTransaction(
  provider: KaspaWalletProvider,
  request: CovenantTxRequest
): Promise<CovenantTxResult> {
  const walletProvider = getWalletProvider(provider);
  if (!walletProvider?.sendCovenantTransaction) {
    return {
      txHash: '',
      status: 'failed',
      error: 'Wallet does not expose sendCovenantTransaction',
    };
  }
  try {
    return await walletProvider.sendCovenantTransaction(request);
  } catch (error) {
    return {
      txHash: '',
      status: 'failed',
      error: formatKaspaWalletError(error),
    };
  }
}

/**
 * Query wallet Toccata / covenant capabilities when exposed.
 */
export async function getWalletCovenantCapabilities(
  provider: KaspaWalletProvider
): Promise<CovenantCapabilities> {
  const walletProvider = getWalletProvider(provider);
  if (!walletProvider) {
    return {
      txV1: false,
      covenantBindings: false,
      canSendCovenantTx: false,
      canSignCovenantPskt: false,
      canBroadcastSignedTx: false,
      hasNativeCovenantSubmit: false,
    };
  }
  if (typeof walletProvider.getCovenantCapabilities === 'function') {
    try {
      return await walletProvider.getCovenantCapabilities();
    } catch {
      // fall through
    }
  }
  const hasNative = Boolean(walletProvider.sendCovenantTransaction);
  const canSign = Boolean(walletProvider.signPskt);
  const canBroadcast = Boolean(walletProvider.pushTx);
  return {
    txV1: hasNative || canSign,
    covenantBindings: hasNative || canSign,
    canSendCovenantTx: hasNative || (canSign && canBroadcast),
    canSignCovenantPskt: canSign,
    canBroadcastSignedTx: canBroadcast,
    hasNativeCovenantSubmit: hasNative,
  };
}

/**
 * Send a transaction via Kaspa wallet
 */
export async function sendKaspaTransaction(
  provider: KaspaWalletProvider,
  transaction: KaspaTransactionRequest
): Promise<KaspaTransactionResponse> {
  if (!getWalletProvider(provider)) {
    return {
      txHash: '',
      status: 'failed',
      error: 'Wallet provider not available. Refresh the page and reconnect your wallet.',
    };
  }

  // Do not gate on isConnected() or getAddress(): KasWare may return false/null while send still works.
  try {
    const normalizedTx = {
      ...transaction,
      to: sdkNormalizeKaspaAddress(transaction.to),
    };

    const walletProvider = getWalletProvider(provider)!;
    const raw = await walletProvider.sendTransaction(normalizedTx);
    const txHash = extractKaspaTransactionId(raw);
    if (!txHash) {
      return {
        txHash: '',
        status: 'failed',
        error:
          'Wallet did not return a valid transaction id. If payment succeeded, check your wallet history for the tx hash.',
      };
    }
    return {
      txHash,
      status: 'pending',
    };
  } catch (error) {
    const errorMessage = formatKaspaWalletError(error);
    return {
      txHash: '',
      status: 'failed',
      error: errorMessage,
    };
  }
}

/**
 * Set up account change listener
 */
export function onKaspaAccountChange(
  provider: KaspaWalletProvider,
  callback: (accounts: string[]) => void
): () => void {
  const walletProvider = getWalletProvider(provider);
  
  if (!walletProvider) {
    return () => {}; // No-op cleanup
  }

  walletProvider.on('accountsChanged', callback);

  // Return cleanup function
  return () => {
    walletProvider.removeListener('accountsChanged', callback);
  };
}

