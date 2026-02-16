'use client';

import Link from 'next/link';
import { ActivityItem } from '@/components/studio/ActivityItem';

export default function StudioDashboard() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Halo Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-100 via-orange-50/30 to-zinc-100 dark:from-zinc-950 dark:via-orange-950/30 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 mb-8">
                {/* Halo Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#02abb8]/10 blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full uppercase tracking-widest border border-orange-500/20">
                                    Creator Mode
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">
                                Creator Dashboard
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl">
                                Welcome back to your workspace. Monitor your publishing activity and manage your digital presence.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 p-5 flex flex-col items-center justify-center min-w-[140px]">
                                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Posts</span>
                                <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">12</div>
                            </div>
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 p-5 flex flex-col items-center justify-center min-w-[140px]">
                                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1">Rewards</span>
                                <div className="text-3xl font-black text-[#02abb8] tracking-tighter">420 KREX</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                        Quick Actions
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                        title="Write Article"
                        description="Create a new post for vBlog"
                        href="/studio/vblog"
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        gradient="from-orange-500/20 to-amber-500/10"
                        accentColor="orange"
                    />
                    <QuickActionCard
                        title="Create Magazine"
                        description="Design your next digital issue"
                        href="/studio/magazine"
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                        gradient="from-blue-500/20 to-indigo-500/10"
                        accentColor="blue"
                    />
                    <QuickActionCard
                        title="List Product"
                        description="Add a new item to Kasparex Store"
                        href="/studio/store"
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" /></svg>}
                        gradient="from-emerald-500/20 to-teal-500/10"
                        accentColor="emerald"
                    />
                </div>
            </section>

            {/* Recent Activity Section */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#02abb8] animate-pulse" />
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                            Recent Activity
                        </h3>
                    </div>
                    <Link href="/studio/activity" className="text-xs font-bold text-[#02abb8] hover:text-[#028a94] transition-colors uppercase tracking-widest">
                        View All Records
                    </Link>
                </div>
                <div className="p-8">
                    <div className="space-y-2">
                        <ActivityItem
                            type="vBlog"
                            title="State of Kaspa 2026"
                            status="Published"
                            time="2 hours ago"
                            cost="0.5 KAS"
                        />
                        <ActivityItem
                            type="Magazine"
                            title="KREX Monthly #4"
                            status="Draft"
                            time="Yesterday"
                            cost="-"
                        />
                        <ActivityItem
                            type="Store"
                            title="Kaspa UI Kit Pro"
                            status="Sold"
                            time="2 days ago"
                            fee="2.5 KAS"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function QuickActionCard({ title, description, href, icon, gradient, accentColor }: { title: string, description: string, href: string, icon: React.ReactNode, gradient: string, accentColor: string }) {
    const accentShadow = {
        orange: 'group-hover:shadow-orange-500/10',
        blue: 'group-hover:shadow-blue-500/10',
        emerald: 'group-hover:shadow-emerald-500/10',
    }[accentColor] || '';

    return (
        <Link href={href} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className={`relative p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] h-full hover:scale-[1.02] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm ${accentShadow}`}>
                <div className={`text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-300 mb-6`}>
                    {icon}
                </div>
                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mb-2">
                    {title}
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    {description}
                </p>
            </div>
        </Link>
    );
}
