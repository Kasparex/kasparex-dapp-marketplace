'use client';

import Link from 'next/link';
import { AD_SLOTS } from '@/lib/ads/slots';

export default function AdsOverviewPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <span className="inline-flex gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#02abb8] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          Kasparex Ads
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-4">
          Ecosystem-wide advertising
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Time-locked ad slots across the Kasparex platform. Pay in KAS, choose a slot and duration, and your ad goes live. No manual approval required.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">How it works</h2>
        <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#02abb8]/20 text-[#02abb8] flex items-center justify-center text-xs font-bold">1</span>
            Connect your wallet and create an ad from the listing page or any &quot;Take this spot&quot; button.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#02abb8]/20 text-[#02abb8] flex items-center justify-center text-xs font-bold">2</span>
            Choose a slot (halo, sidebar, or footer) and duration (e.g. 30 days).
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#02abb8]/20 text-[#02abb8] flex items-center justify-center text-xs font-bold">3</span>
            Add your image URL, link and title, then pay with L1 (KAS) or L2.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#02abb8]/20 text-[#02abb8] flex items-center justify-center text-xs font-bold">4</span>
            Your ad goes live after payment confirmation and expires when the period ends.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Pricing (per slot)</h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">Slot</th>
                <th className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">Per day</th>
                <th className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">30 days</th>
              </tr>
            </thead>
            <tbody>
              {AD_SLOTS.map((slot) => (
                <tr key={slot.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{slot.label}</td>
                  <td className="px-4 py-3">{slot.pricePerDay} KAS</td>
                  <td className="px-4 py-3">{slot.pricePer30Days} KAS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/ads"
          className="px-6 py-2.5 bg-[#02abb8] hover:bg-[#029ca8] text-white rounded-xl font-bold text-sm transition-colors"
        >
          View active campaigns
        </Link>
        <Link
          href="/studio/ads"
          className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-bold text-sm transition-colors"
        >
          My Ads (Studio)
        </Link>
      </div>
    </div>
  );
}
