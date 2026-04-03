/**
 * Kastle wallet integration (browser extension `window.kastle`).
 * API: https://github.com/forbole/kastle/blob/main/docs/kastle-api.md
 */

import { kastleBalanceToKas, kaswareBalanceToKas } from "./balance";

/** Loose typing: Kastle evolves and may add KasWare-compat shims */
export type KastleProvider = {
  connect?: () => Promise<boolean>;
  request?: (method: string, ...args: unknown[]) => Promise<unknown>;
  getAccount?: () => Promise<{ address: string; publicKey?: string }>;
  getAddress?: () => Promise<string | null>;
  requestAccounts?: () => Promise<string[]>;
  getBalance?: () => Promise<
    | { balance: string }
    | string
    | number
    | { balance: number }
    | null
  >;
  getNetwork?: () => Promise<string>;
  disconnect?: () => Promise<void>;
  isConnected?: () => boolean;
  signMessage?: (msg: string, type?: string) => Promise<string>;
  sendKaspa?: (
    toAddress: string,
    sompi: number | string,
    options?: Record<string, unknown>
  ) => Promise<string>;
  getKRC20Balance?: () => Promise<
    Array<{ tick: string; amount: string | number; [key: string]: unknown }>
  >;
  getUtxoEntries?: () => Promise<unknown>;
  getVersion?: () => Promise<string>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
};

export function getKastleProvider(): KastleProvider | null {
  if (typeof window === "undefined") return null;
  const kastle = (window as unknown as { kastle?: KastleProvider }).kastle;
  return kastle ?? null;
}

export function isKastleInstalled(): boolean {
  return getKastleProvider() !== null;
}

export async function connectKastle(): Promise<string | null> {
  const provider = getKastleProvider();
  if (!provider) {
    throw new Error("Kastle wallet not found. Please install Kastle extension.");
  }

  if (typeof provider.connect === "function") {
    const ok = await provider.connect();
    if (!ok) {
      throw new Error("Kastle connection was rejected.");
    }
  } else if (typeof provider.request === "function") {
    const ok = await provider.request("kas:connect");
    if (ok === false) {
      throw new Error("Kastle connection was rejected.");
    }
  } else if (typeof provider.requestAccounts === "function") {
    const accounts = await provider.requestAccounts();
    if (!accounts?.length) {
      throw new Error("No accounts returned from Kastle.");
    }
  } else {
    throw new Error(
      "Kastle API not supported. Please update the Kastle extension."
    );
  }

  return getKastleAddress();
}

export async function getKastleAddress(): Promise<string | null> {
  const provider = getKastleProvider();
  if (!provider) return null;

  try {
    if (typeof provider.getAccount === "function") {
      const acc = await provider.getAccount();
      if (acc?.address) return acc.address;
    }
    if (typeof provider.request === "function") {
      const r = await provider.request("kas:get_account");
      if (r && typeof r === "object" && r !== null && "address" in r) {
        const addr = (r as { address?: string }).address;
        if (addr) return addr;
      }
    }
    if (typeof provider.getAddress === "function") {
      const a = await provider.getAddress();
      if (a) return a;
    }
    if (typeof provider.requestAccounts === "function") {
      const accounts = await provider.requestAccounts();
      if (accounts?.length) return accounts[0];
    }
  } catch (error) {
    console.error("Error getting Kastle address:", error);
  }
  return null;
}

export async function getKastlePublicKey(): Promise<string | null> {
  const provider = getKastleProvider();
  if (!provider) return null;
  try {
    if (typeof provider.getAccount === "function") {
      const acc = await provider.getAccount();
      return acc?.publicKey ?? null;
    }
    if (typeof provider.request === "function") {
      const r = await provider.request("kas:get_account");
      if (r && typeof r === "object" && r !== null && "publicKey" in r) {
        const pk = (r as { publicKey?: string }).publicKey;
        return pk ?? null;
      }
    }
  } catch (error) {
    console.error("Error getting Kastle public key:", error);
  }
  return null;
}

/** Balance in KAS (not sompi). */
export async function getKastleBalanceKas(): Promise<number | null> {
  const provider = getKastleProvider();
  if (!provider || typeof provider.getBalance !== "function") return null;

  try {
    const raw = await provider.getBalance();
    const fromKastle = kastleBalanceToKas(raw);
    if (fromKastle !== null) return fromKastle;
    return kaswareBalanceToKas(raw);
  } catch (error) {
    console.error("Error getting Kastle balance:", error);
    return null;
  }
}

export async function getKastleNetwork(): Promise<string | null> {
  const provider = getKastleProvider();
  if (!provider || typeof provider.getNetwork !== "function") return null;
  try {
    return await provider.getNetwork();
  } catch (error) {
    console.error("Error getting Kastle network:", error);
    return null;
  }
}

export async function disconnectKastle(): Promise<void> {
  const provider = getKastleProvider();
  if (!provider) return;

  try {
    if (typeof provider.disconnect === "function") {
      await provider.disconnect();
    }
  } catch (error) {
    console.error("Error disconnecting from Kastle:", error);
  }
}

export async function getKastleKrc20Balances(): Promise<
  Array<{ tick: string; amount: string | number; [key: string]: unknown }>
> {
  const provider = getKastleProvider();
  if (!provider || typeof provider.getKRC20Balance !== "function") {
    return [];
  }
  try {
    const list = await provider.getKRC20Balance();
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error getting Kastle KRC-20 balances:", error);
    return [];
  }
}
