export function ChroniclesHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-white via-cyan-500/5 to-transparent dark:from-zinc-900 dark:via-cyan-500/10 dark:to-zinc-950 p-6 sm:p-8 mb-10">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#02abb8]/10 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#02abb8] mb-2">Lore codex</p>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Krex&apos;s Chronicles
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
            Wiki, story, and CMS-ready lore for Kaspaland — the narrative backbone of Kasparex.
          </p>
        </div>
        <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[200px] h-[140px]">
          <div className="absolute inset-0 flex items-center justify-center opacity-90 pointer-events-none">
            <div className="w-28 h-36 rounded-xl border-2 border-cyan-500/30 bg-white/80 dark:bg-zinc-900/80 shadow-xl shadow-cyan-500/10 rotate-6" />
            <div className="absolute w-24 h-32 rounded-lg border border-[#02abb8]/40 bg-zinc-100/90 dark:bg-zinc-800/90 -rotate-3" />
          </div>
          <span className="relative text-[10px] font-black text-zinc-500 uppercase tracking-widest">Chronicles</span>
        </div>
      </div>
    </div>
  );
}
