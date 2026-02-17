'use client';

import { useAccount } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { generateReferralLink } from '@/lib/revenue-tree/referral';
import { generateDAppSlug } from '@/lib/utils';

interface DAppActionsColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppActionsColumn({ dapp, contractAddress }: DAppActionsColumnProps) {
  const { address: userWalletAddress } = useAccount();
  const slug = dapp.slug || generateDAppSlug(dapp.name);

  // Generate mock revenue tree data (will be replaced with real data later)
  const revenueTreeData = userWalletAddress
    ? generateMockRevenueTree(dapp.id, slug, userWalletAddress, true)
    : null;

  // Update referral link with actual wallet address if available
  if (revenueTreeData && userWalletAddress) {
    revenueTreeData.referralLink = generateReferralLink('dapp', slug, userWalletAddress);
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4">
          Actions
        </h3>
        <div className="space-y-3">
          {/* Example action buttons - customize based on dApp needs */}
          <button className="w-full py-3 px-4 bg-[#02abb8] hover:bg-[#0299a6] text-white font-black text-sm uppercase tracking-wider rounded-lg transition-colors">
            Pay
          </button>
          <button className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-sm uppercase tracking-wider rounded-lg transition-colors">
            Send
          </button>
        </div>
      </div>

      {/* Costs and Fees Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4">
          Costs & Fees
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Base Cost</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">100 KAS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Network Fee</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">~0.001 KAS</span>
          </div>
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="text-lg font-black text-[#02abb8]">100.001 KAS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Tree Section */}
      {revenueTreeData && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <RevenueTree data={revenueTreeData} userWalletAddress={userWalletAddress || undefined} />
        </div>
      )}
    </div>
  );
}
