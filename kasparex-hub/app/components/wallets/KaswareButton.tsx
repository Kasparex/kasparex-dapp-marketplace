/**
 * Kasware Wallet Connect Button
 */

import { useState } from "react";
import { useKaspaWallet } from "~/lib/kaspa/provider";
import { KaspaWalletModal } from "./KaspaWalletModal";

export function KaswareButton() {
  const { address, isConnected, walletType, disconnect } = useKaspaWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const isKaswareConnected = isConnected && walletType === 'kasware';

  if (isKaswareConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm sm:text-base"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm sm:text-base"
      >
        Connect Kasware
      </button>
      <KaspaWalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}



