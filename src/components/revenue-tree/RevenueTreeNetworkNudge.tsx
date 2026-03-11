'use client';

import { useRevenueTree } from '@/hooks/useRevenueTree';
import { useAccount } from 'wagmi';

/**
 * Renders a warning message if the user's direct referrer (L1) has gone inactive,
 * missing out on their 2% share. Encourages social nudges.
 */
export interface RevenueTreeNetworkNudgeProps {
    address?: string;
}

export function RevenueTreeNetworkNudge({ address: propAddress }: RevenueTreeNetworkNudgeProps) {
    const { address: connectedAddress } = useAccount();
    const { tree, isSupported } = useRevenueTree(
        propAddress ? { userAddress: propAddress as `0x${string}` } : {}
    );

    if (!tree || !isSupported) return null;

    // L1 is upline[0]
    const l1Wallet = tree.upline[0];
    const isL1Active = tree.isActiveAtLevel && tree.isActiveAtLevel[0];
    const isRealWallet = l1Wallet && l1Wallet !== '0x0000000000000000000000000000000000000000';

    // If there is no referrer at all, we don't nag.
    // If the referrer is active, we don't nag.
    // We only nag if there is a real wallet recorded that has lost its status.
    if (!isRealWallet || isL1Active) return null;

    return (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start shadow-sm">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Your Referrer is Inactive!
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300/80 mt-1 max-w-3xl">
                    The person who invited you (<strong>{l1Wallet.slice(0, 6)}…{l1Wallet.slice(-4)}</strong>) has fallen below their tier maintenance volume.
                    Their <strong className="text-amber-900 dark:text-amber-200">2% L1 share</strong> from your spend is currently routing to the Genesis Treasury.
                    Remind them to use Kasparex dApps to reclaim their rewards!
                </p>
            </div>
        </div>
    );
}
