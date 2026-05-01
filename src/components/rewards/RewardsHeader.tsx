'use client';

export function RewardsHeader() {
  return (
    <div
      id="rewards-intro"
      className="scroll-mt-24 relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/60 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/30 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.16),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.09),transparent_70%)] rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#017a84] dark:text-[#8ff1f8] text-[10px] font-black uppercase tracking-[0.2em] w-fit">
          Rewards
        </div>
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Rewards, perks &amp; badges
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Browse everything you can unlock across Kasparex: filter by type, search benefits, and see what is already active for your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}

