'use client';

import { StudioSidebar } from '@/components/studio/StudioSidebar';
import { L1L2Indicator } from '@/components/studio/L1L2Indicator';
import { UserMenu } from '@/components/UserMenu';
import { WalletStatus } from '@/components/WalletStatus';

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Sidebar */}
            <StudioSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                            Workspace
                        </h1>
                        <L1L2Indicator />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <WalletStatus />
                        </div>
                        <UserMenu />
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black/20 p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
