'use client';

import Link from 'next/link';

export default function StudioDashboard() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter mb-2">
                        Creator Dashboard
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                        Welcome back to your workspace. What are we building today?
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Posts</span>
                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase">12</span>
                    </div>
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Rewards</span>
                        <span className="text-2xl font-black text-[#02abb8] uppercase">420 KREX</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                        title="Write Article"
                        description="Create a new post for vBlog"
                        href="/studio/vblog"
                        emoji="✍️"
                        gradient="from-orange-500/20 to-amber-500/10"
                    />
                    <QuickActionCard
                        title="Create Magazine"
                        description="Design your next digital issue"
                        href="/studio/magazine"
                        emoji="📖"
                        gradient="from-blue-500/20 to-indigo-500/10"
                    />
                    <QuickActionCard
                        title="List Product"
                        description="Add a new item to Kasparex Store"
                        href="/studio/store"
                        emoji="🛍️"
                        gradient="from-emerald-500/20 to-teal-500/10"
                    />
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        Recent Activity
                    </h3>
                    <Link href="/studio/activity" className="text-xs font-bold text-[#02abb8] hover:underline uppercase tracking-widest">
                        View All
                    </Link>
                </div>
                <div className="p-8">
                    <div className="space-y-6">
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
            </div>
        </div>
    );
}

function QuickActionCard({ title, description, href, emoji, gradient }: { title: string, description: string, href: string, emoji: string, gradient: string }) {
    return (
        <Link href={href} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] h-full hover:scale-[1.02] transition-all duration-300">
                <div className="text-4xl mb-6">{emoji}</div>
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

function ActivityItem({ type, title, status, time, cost, fee }: { type: string, title: string, status: string, time: string, cost?: string, fee?: string }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors px-2 rounded-xl">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                    {type[0]}
                </div>
                <div>
                    <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        {title}
                    </h5>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{type}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{time}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${status === 'Published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {status}
                    </span>
                </div>
                {(cost || fee) && (
                    <div className="w-20 text-right">
                        <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase">
                            {cost || fee}
                        </span>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                            {cost ? 'Cost' : 'Fee'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
