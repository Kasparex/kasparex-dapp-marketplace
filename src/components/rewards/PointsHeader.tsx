'use client';

export function PointsHeader() {
  return (
    <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/60 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/30 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.16),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.09),transparent_70%)] rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#017a84] dark:text-[#8ff1f8] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            Points
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Scores &amp; points
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
            Rules and tables for how points are earned, how scores are computed, and what each module contributes.
          </p>
        </div>
        <div className="hidden lg:flex items-center justify-center flex-shrink-0 opacity-90">
          <div className="relative">
            <div className="w-48 h-56 rounded-2xl border-2 border-[#02abb8]/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-[#02abb8]/10 rotate-3 transform" />
            <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-[#02abb8]/20 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform" />
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-lg border border-zinc-300 dark:border-zinc-700/50 flex items-center justify-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SCORE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
