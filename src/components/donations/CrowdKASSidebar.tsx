'use client';

import Link from 'next/link';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { EVMWalletButton } from '@/components/EVMWalletButton';

export type KaspaProviderId = 'kasware' | 'kastle';

export interface CrowdKASSidebarProps {
  kaspaAddress: string | null;
  kaspaConnected: boolean;
  onConnectKaspa: (provider: KaspaProviderId) => void;
  isConnectingKaspa: boolean;
  activeView?: 'studio' | 'campaigns';
}

export function CrowdKASSidebar({
  kaspaAddress,
  kaspaConnected,
  onConnectKaspa,
  isConnectingKaspa,
}: CrowdKASSidebarProps) {
  const header = (onHide: () => void) => (
    <SidebarHeader backHref="/donations" backLabel="Back to CrowdKAS" onHide={onHide} />
  );

  return (
    <UnifiedSidebar storageKeyPrefix="crowdkas-studio" header={header}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-2">Kasparex CrowdKAS</p>
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Studio</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Create and manage your crowdfunding campaign.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">L2 wallet (EVM)</p>
          <EVMWalletButton />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Required for verify, create, edit, claim.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">L1 wallet (Kaspa)</p>
          {kaspaConnected ? (
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Connected</div>
              <div className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all">{kaspaAddress}</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onConnectKaspa('kasware')}
                disabled={isConnectingKaspa}
                className="k-control-btn !bg-[#02abb8] hover:!bg-[#0296a1] !text-white !border-[#02abb8]/50 px-4"
              >
                {isConnectingKaspa ? 'Connecting…' : 'Connect KasWare'}
              </button>
              <button
                type="button"
                onClick={() => onConnectKaspa('kastle')}
                disabled={isConnectingKaspa}
                className="k-control-btn !bg-cyan-700 hover:!bg-cyan-800 !text-white !border-cyan-600/50 px-4"
              >
                {isConnectingKaspa ? 'Connecting…' : 'Connect Kastle'}
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Optional: used for L1 donation address convenience.
          </p>
        </div>

        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Link href="/donations" className="k-control-btn w-full justify-center">
            View campaigns
          </Link>
        </div>
      </div>
    </UnifiedSidebar>
  );
}

