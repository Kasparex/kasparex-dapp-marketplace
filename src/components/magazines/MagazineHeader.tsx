'use client';

export function MagazineHeader() {
    return (
        <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-zinc-950">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#02abb8,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#00c2b2,transparent_50%)]" />
            </div>

            <div className="relative z-10 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    Digital Publishing
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                    Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Magazines</span>
                </h1>

                <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
                    The hub for digital publications within the Kaspa ecosystem. High-quality magazines, technical deep dives, and community-driven content, all powered by KAS.
                </p>
            </div>

            <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:flex items-center justify-center opacity-40">
                <div className="relative w-64 h-80 rounded-lg border-2 border-cyan-500/30 transform rotate-12 -translate-x-12 translate-y-12 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border border-zinc-700 rounded" />
                </div>
                <div className="relative w-64 h-80 rounded-lg border-2 border-emerald-500/30 transform -rotate-6 shadow-2xl overflow-hidden bg-zinc-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-800" />
                    <div className="absolute top-6 left-6 text-zinc-500 text-xs font-bold">KREX MAGAZINE</div>
                </div>
            </div>
        </div>
    );
}
