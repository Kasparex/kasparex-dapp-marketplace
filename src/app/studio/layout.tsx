'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StudioSidebar } from '@/components/studio/StudioSidebar';

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />

            <main className="flex-1 min-h-[calc(100vh-4rem)]">
                <div className="flex flex-col lg:flex-row h-full">
                    {/* Sidebar */}
                    <StudioSidebar />

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
                        <div className="max-w-7xl mx-auto">
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
