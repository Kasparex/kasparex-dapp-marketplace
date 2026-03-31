'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';

export function AuthorPricing() {
    const { createFee, editFee, deleteFee } = useVBlogPricing();

    const benefits = [
        {
            title: 'Global Exposure',
            description: 'Your articles are syndicated across the entire Kasparex network and Magazines.',
            icon: (
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 4.03 3 9s-1.343 9-3 9m0-18c-1.657 0-3 4.03-3 9s1.343 9 3 9m-9-9a9 9 0 019-9" />
                </svg>
            )
        },
        {
            title: 'Decentralized Storage',
            description: 'Permanent content hosting on IPFS and Kaspa chain for absolute ownership.',
            icon: (
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            )
        },
        {
            title: 'Revenue Sharing',
            description: 'Earn 100% of tips and rewards from readers, with no hidden platform cuts.',
            icon: (
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    return (
        <div className="space-y-8 mt-12">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Author Benefits & Pricing</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Understand your impact and costs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {benefits.map((benefit, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[32px] shadow-sm">
                        <div className="w-10 h-10 bg-orange-500/5 rounded-xl flex items-center justify-center mb-4">
                            {benefit.icon}
                        </div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wide">{benefit.title}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                            {benefit.description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-950 rounded-[40px] p-8 sm:p-12 relative overflow-hidden border border-zinc-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Transparent Pricing</h3>
                        <p className="text-zinc-400 font-medium mb-8">
                            Kasparex vBlog uses a simple fee structure to ensure permanent storage and network security.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold text-zinc-300">Publishing Fee</span>
                                <span className="text-lg font-black text-orange-400">{createFee} <span className="text-[10px] text-zinc-500">KAS</span></span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold text-zinc-300">Edit Fee</span>
                                <span className="text-lg font-black text-orange-400">{editFee} <span className="text-[10px] text-zinc-500">KAS</span></span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold text-zinc-300">Delete Fee</span>
                                <span className="text-lg font-black text-orange-400">{deleteFee} <span className="text-[10px] text-zinc-500">KAS</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[32px] p-8 shadow-2xl shadow-orange-500/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-widest">Holder Advantage</span>
                        </div>

                        <h4 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Save on Fees</h4>
                        <p className="text-white/80 text-sm font-medium mb-6 leading-relaxed">
                            Holders of <span className="text-white font-black">KREX</span> or specific <span className="text-white font-black">Kasparex NFTs</span> enjoy up to <span className="text-white font-black">50% discount</span> on all platform interaction fees.
                        </p>

                        <div className="inline-block px-5 py-2.5 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform cursor-pointer">
                            View Your Tier Benefits
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
