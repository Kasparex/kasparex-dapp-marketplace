'use client';

import { useState } from 'react';

export function L1L2Indicator() {
    const [layer, setLayer] = useState<'L1' | 'L2'>('L2');

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-full">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${layer === 'L1' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Network: <span className={layer === 'L1' ? 'text-orange-500' : 'text-emerald-500'}>{layer}</span>
                </span>
            </div>

            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

            <button
                onClick={() => setLayer(layer === 'L1' ? 'L2' : 'L1')}
                className="text-[9px] font-bold uppercase tracking-tighter text-zinc-400 hover:text-[#02abb8] transition-colors"
            >
                Switch
            </button>
        </div>
    );
}
