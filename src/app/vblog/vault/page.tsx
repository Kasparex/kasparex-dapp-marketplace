'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { useVBlog } from '@/hooks/useVBlog';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { VBlogModuleUnlockCards } from '@/components/vblog/VBlogModuleUnlockCards';

export default function VBlogVaultPage() {
  const { articles } = useVBlog();
  const pricing = useVBlogPricing();
  const { balance, tier } = useKREXBalance();
  const { nfts } = useNFTStatus();
  const discountPct = krexTierDiscountPercent(tier);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <VBlogSidebar
            articles={articles}
            selectedCategory={null}
            selectedTags={[]}
            searchQuery=""
            onCategoryChange={() => {}}
            onTagToggle={() => {}}
            onSearchChange={() => {}}
            activeView="vault"
          />

          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto space-y-8 text-base sm:text-[17px] text-zinc-700 dark:text-zinc-300">
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-white via-cyan-500/5 to-transparent dark:from-zinc-900 dark:via-cyan-500/10 dark:to-zinc-950 p-8 sm:p-10">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#02abb8] mb-4">Vault & unlocks</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                  Unlock vBlog monetization modules
                </h1>
                <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  Unlock modules once, then activate premium sections, tips, polls, and badge systems across your articles. Holder discounts (KREX + NFTs) apply to unlock pricing.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">KREX balance</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{balance.toLocaleString()}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Tier: {tier}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Holder discount</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{discountPct}%</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">KREX tier baseline; NFTs can increase unlock discount.</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">NFT holdings</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{nfts.length}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Eligible for slot-based boosts and perks.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-4">
                <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">Current fee model</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Publish article</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{pricing.createFee} KAS</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Edit article</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{pricing.editFee} KAS</p>
                  </div>
                </div>
              </div>

              <VBlogModuleUnlockCards title="Author module unlocks" />

              <div className="flex flex-wrap gap-3">
                <Link href="/vblog/dashboard" className="k-control-btn">Go to Author Dashboard</Link>
                <Link href="/vblog" className="k-control-btn">Explore Articles</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

