'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdSlider } from '@/components/ads/AdSlider';
import { ProtocolFamilyCard } from '@/components/protocols/ProtocolFamilyCard';
import { ProtocolsIndexSidebar } from '@/components/protocols/ProtocolsIndexSidebar';
import { PROTOCOL_FAMILIES } from '@/lib/protocolFamilies';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';

export function ProtocolsHomeContent() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
        <ProtocolsIndexSidebar />

        <div className="relative min-w-0 flex-1 border-l border-zinc-200 p-4 sm:p-6 lg:p-8 lg:pl-6 dark:border-zinc-800">
          <div className="mx-auto max-w-7xl">
            <div className={`mb-6 flex flex-wrap gap-4 ${HUB_HALO_MOBILE_FALLBACK}`}>
              <a
                href="#protocol-families"
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-teal-700"
              >
                Browse families
              </a>
              <Link
                href="/protocols/kpx#tools"
                className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-bold text-zinc-800 transition-colors hover:border-[#02abb8]/50 hover:text-[#02abb8] dark:border-zinc-600 dark:text-zinc-100 dark:hover:border-[#02abb8]/40"
              >
                KPX tools
              </Link>
            </div>
            <div className={`relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute right-0 top-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.09),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)]" />
                <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-200">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                    </span>
                    Open standards
                  </div>
                  <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
                    Kasparex{' '}
                    <span className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-cyan-300 dark:to-teal-300">
                      Protocols
                    </span>
                  </h1>
                  <p className="kx-body mb-8 max-w-xl leading-relaxed">
                    Pick a protocol family to open its hub: tools you can run today, HTTP APIs, use cases, and docs - starting with{' '}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">kpx</span> on Kaspa.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="#protocol-families"
                      className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-teal-700"
                    >
                      Browse families
                    </a>
                    <Link
                      href="/protocols/kpx#tools"
                      className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-bold text-zinc-800 transition-colors hover:border-[#02abb8]/50 hover:text-[#02abb8] dark:border-zinc-600 dark:text-zinc-100 dark:hover:border-[#02abb8]/40"
                    >
                      KPX tools
                    </Link>
                  </div>
                </div>
                <div className="relative hidden w-[280px] shrink-0 items-center justify-center lg:flex">
                  <div className="pointer-events-none relative opacity-90">
                    <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-cyan-500/30 bg-white/80 shadow-2xl shadow-cyan-500/10 dark:bg-zinc-900/80" />
                    <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-teal-500/20 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
                    <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">kpx · ktree · kref</span>
                    </div>
                  </div>
                  <div
                    id="ad-slot-protocols-halo"
                    className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center scroll-mt-24"
                  >
                    <AdSlider slotId="HALO_PROTOCOLS_RIGHT" />
                  </div>
                </div>
              </div>
            </div>

            <div id="protocol-families" className="scroll-mt-24">
              <h2 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Protocol families</h2>
              <p className="mb-6 kx-body">
                Each card opens a dedicated page for that protocol (tools, APIs, use cases, and documentation).
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PROTOCOL_FAMILIES.map((family) => (
                  <ProtocolFamilyCard key={family.slug} family={family} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
