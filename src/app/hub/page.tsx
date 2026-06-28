'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProjectCard } from '@/components/ProjectCard';
import { hubProjects } from '@/lib/hubProjects';

export default function HubPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4 lg:pb-5">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-orange-500/10 via-transparent to-transparent hidden dark:block" />
          <div className="absolute bottom-0 left-0 w-[50%] h-full bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent hidden dark:block" />

          {/* Brand Visual Layer */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-orange-500/5 blur-[60px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-emerald-500/5 blur-[50px] rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-4">
                The Kasparex Ecosystem
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-4 leading-[1.05] uppercase tracking-tighter">
                Welcome to <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-orange-500 to-zinc-900 dark:from-white dark:via-orange-500 dark:to-white bg-[length:200%_auto] animate-gradient-x px-2">
                  Kasparex Hub
                </span>
              </h1>
              <p className="kx-body mb-6 leading-relaxed max-w-2xl mx-auto font-medium">
                Your unified gateway to the Kasparex ecosystem. Explore modular dApps, media, games, publishing tools, and infrastructure built around Kaspa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dapps" className="k-cta-primary w-full sm:w-auto justify-center text-xs py-2.5 px-5">
                  Explore dApps
                </Link>
                <Link href="/rewards" className="k-cta-secondary w-full sm:w-auto justify-center text-xs py-2.5 px-5">
                  View Rewards
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Grid Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Explore Our Projects
              </h2>
              <p className="kx-body max-w-2xl mx-auto">
                Discover projects across the Kasparex ecosystem. Cards summarize typical redeemable Hub pts tied to Rewards policy;
                authoritative numbers stay on Rewards → Points and History per wallet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hubProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystem Overview Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
                Kasparex Ecosystem Overview
              </h2>
              <p className="kx-body text-center">
                Kasparex is a unified hub of modular dApps, media, games, publishing tools and infrastructure built around Kaspa. Everything connects through wallet-based interactions, smart logic and on-chain actions. All these projects are designed to work together so that users, builders and creators can move between them smoothly, creating a seamless experience across the entire ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Key Features
              </h2>
              <p className="kx-body max-w-2xl mx-auto">
                What makes Kasparex unique
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Feature 1: Modular dApps */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  Modular dApps
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Reusable and combinable dApps that can be integrated and extended across the ecosystem.
                </p>
              </div>

              {/* Feature 2: Wallet Native */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  Wallet Native Interaction
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Transparent and real usage through wallet-based interactions that put you in control.
                </p>
              </div>

              {/* Feature 3: Creator Infrastructure */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  Creator Infrastructure
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Publish music, posts and magazines using CIDs and IPFS-like storage for decentralized content.
                </p>
              </div>

              {/* Feature 4: Unified Hub */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  One Unified Hub
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Everything collected in one place instead of many separate websites for a seamless experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits and Rewards Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
                Benefits and Rewards
              </h2>

              <div className="space-y-6 kx-body">
                <p>
                  Users earn <strong className="text-zinc-900 dark:text-zinc-100">GRID</strong> (Global Reward Token) for using any dApp in the ecosystem. Holding KREX and NFTs multiplies your GRID rewards.
                </p>
                <p>
                  Holding <strong className="text-zinc-900 dark:text-zinc-100">KREX</strong> and specific <strong className="text-zinc-900 dark:text-zinc-100">NFTs</strong> in the ecosystem can increase multipliers, reduce usage fees on dApps, unlock special sections or premium tools, and give extra perks such as access to certain games, vBlog features, magazines or gated experiences.
                </p>
                <p>
                  There will be periodic <strong className="text-zinc-900 dark:text-zinc-100">missions, drops, raffles or seasonal events</strong> that use the same reward logic, so the more users explore Kasparex Hub, the more long-term value they can build up in rewards and reputation.
                </p>
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/rewards"
                  className="inline-block px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Learn More About Rewards
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

