'use client';

import { Activity } from '@/components/Activity';
import { useAccount } from 'wagmi';

export default function StudioActivityPage() {
    const { address } = useAccount();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter mb-2">
                    Activity & Records
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                    A complete overview of your activity, including created posts, transactions, and usage history.
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                {address ? (
                    <Activity walletAddress={address} />
                ) : (
                    <div className="text-center py-20">
                        <div className="text-4xl mb-4">🪪</div>
                        <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
                            Please connect your wallet to view history
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
