/**
 * Kaspa Wallet Provider
 *
 * React context for Kasware and Kastle (window.kasware / window.kastle).
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  connectKasware,
  getKaswareAddress,
  getKaswareBalanceKas,
  disconnectKasware,
  isKaswareInstalled,
  getKaswareNetwork,
  type KaswareProvider,
} from "./kasware";
import {
  connectKastle,
  getKastleAddress,
  getKastleBalanceKas,
  disconnectKastle,
  isKastleInstalled,
  getKastleNetwork,
  getKastlePublicKey,
  type KastleProvider,
} from "./kastle";

export type KaspaWalletType = "kasware" | "kastle" | null;

export interface KaspaWalletState {
  address: string | null;
  /** KAS amount for display */
  balance: number | null;
  network: string | null;
  publicKey: string | null;
  walletType: KaspaWalletType;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface KaspaWalletContextType extends KaspaWalletState {
  connect: (walletType: "kasware" | "kastle") => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const KaspaWalletContext = createContext<KaspaWalletContextType | undefined>(
  undefined
);

const emptyState: KaspaWalletState = {
  address: null,
  balance: null,
  network: null,
  publicKey: null,
  walletType: null,
  isConnected: false,
  isLoading: false,
  error: null,
};

export function KaspaWalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KaspaWalletState>(emptyState);

  const refreshWallet = useCallback(async (walletType: "kasware" | "kastle") => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let address: string | null = null;
      let balance: number | null = null;
      let network: string | null = null;
      let publicKey: string | null = null;

      if (walletType === "kasware") {
        address = await getKaswareAddress();
        if (address) {
          balance = await getKaswareBalanceKas();
          network = await getKaswareNetwork();
        }
      } else {
        address = await getKastleAddress();
        if (address) {
          balance = await getKastleBalanceKas();
          network = await getKastleNetwork();
          publicKey = await getKastlePublicKey();
        }
      }

      setState((prev) => ({
        ...prev,
        address,
        balance,
        network,
        publicKey: walletType === "kastle" ? publicKey : null,
        walletType: address ? walletType : null,
        isConnected: !!address,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to refresh wallet",
      }));
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("kaspa_wallet_type") as KaspaWalletType;
    if (saved === "kasware" || saved === "kastle") {
      void refreshWallet(saved);
    }
  }, [refreshWallet]);

  useEffect(() => {
    if (!state.walletType || !state.isConnected) return;

    const wt = state.walletType;

    const handleAccountsChanged: (...args: unknown[]) => void = (...args) => {
      const accounts = args[0];
      if (!Array.isArray(accounts) || accounts.length === 0) {
        setState((prev) => ({
          ...prev,
          ...emptyState,
        }));
        localStorage.removeItem("kaspa_wallet_type");
      } else {
        void refreshWallet(wt);
      }
    };

    const handleNetworkChanged = () => {
      void refreshWallet(wt);
    };

    let provider: KaswareProvider | KastleProvider | null = null;
    if (state.walletType === "kasware") {
      provider = (window as unknown as { kasware: KaswareProvider }).kasware;
    } else if (state.walletType === "kastle") {
      provider = (window as unknown as { kastle: KastleProvider }).kastle;
    }

    if (!provider?.on) return undefined;

    provider.on("accountsChanged", handleAccountsChanged);
    if (wt === "kastle") {
      provider.on("networkChanged", handleNetworkChanged);
      provider.on("kas:network_changed", handleNetworkChanged);
    }

    return () => {
      provider?.removeListener?.("accountsChanged", handleAccountsChanged);
      if (wt === "kastle") {
        provider?.removeListener?.("networkChanged", handleNetworkChanged);
        provider?.removeListener?.("kas:network_changed", handleNetworkChanged);
      }
    };
  }, [state.walletType, state.isConnected, refreshWallet]);

  const connect = async (walletType: "kasware" | "kastle") => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let address: string | null = null;
      let balance: number | null = null;
      let network: string | null = null;
      let publicKey: string | null = null;

      if (walletType === "kasware") {
        if (!isKaswareInstalled()) {
          throw new Error(
            "KasWare wallet not found. Please install the KasWare extension."
          );
        }
        address = await connectKasware();
        if (address) {
          balance = await getKaswareBalanceKas();
          network = await getKaswareNetwork();
          localStorage.setItem("kaspa_wallet_type", "kasware");
        }
      } else if (walletType === "kastle") {
        if (!isKastleInstalled()) {
          throw new Error(
            "Kastle wallet not found. Please install the Kastle extension."
          );
        }
        address = await connectKastle();
        if (address) {
          balance = await getKastleBalanceKas();
          network = await getKastleNetwork();
          publicKey = await getKastlePublicKey();
          localStorage.setItem("kaspa_wallet_type", "kastle");
        }
      }

      setState((prev) => ({
        ...prev,
        address,
        balance,
        network,
        publicKey: walletType === "kastle" ? publicKey : null,
        walletType: address ? walletType : null,
        isConnected: !!address,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to connect wallet",
      }));
      throw error;
    }
  };

  const disconnect = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (state.walletType === "kasware") {
        await disconnectKasware();
      } else if (state.walletType === "kastle") {
        await disconnectKastle();
      }

      localStorage.removeItem("kaspa_wallet_type");
      setState((prev) => ({
        ...prev,
        ...emptyState,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to disconnect wallet",
      }));
    }
  };

  const refresh = async () => {
    if (state.walletType) {
      await refreshWallet(state.walletType);
    }
  };

  return (
    <KaspaWalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        refresh,
      }}
    >
      {children}
    </KaspaWalletContext.Provider>
  );
}

export function useKaspaWallet() {
  const context = useContext(KaspaWalletContext);
  if (context === undefined) {
    throw new Error("useKaspaWallet must be used within a KaspaWalletProvider");
  }
  return context;
}
