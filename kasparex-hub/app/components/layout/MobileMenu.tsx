import { Link } from "@remix-run/react";
import { KaswareButton } from "../wallets/KaswareButton";
import { KastleButton } from "../wallets/KastleButton";
import { EVMWalletButton } from "../wallets/EVMWalletButton";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="mobile-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="p-4">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 text-zinc-900 dark:text-zinc-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2 mb-6">
            <Link
              to="/"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              Hub
            </Link>
            <Link
              to="/dapps"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              dApps
            </Link>
            <Link
              to="/vblog"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              vBlog
            </Link>
            <Link
              to="/points"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              Rewards
            </Link>
            <Link
              to="/profile"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              Profile
            </Link>
          </nav>

          {/* Wallet Connect Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3 px-4">
              Connect Wallet
            </h3>
            <div className="space-y-2 px-4">
              {/* Kaspa Wallets */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Kaspa Wallets</div>
                <KaswareButton />
                <KastleButton />
              </div>
              {/* EVM Wallets */}
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">EVM Wallets</div>
                <EVMWalletButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

