'use client';

export function ActivityItem({ type, title, status, time, cost, fee }: { type: string, title: string, status: string, time: string, cost?: string, fee?: string }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors px-2 rounded-xl group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500 dark:text-zinc-400 uppercase border border-zinc-200 dark:border-zinc-700 group-hover:border-[#02abb8]/30 transition-colors">
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
