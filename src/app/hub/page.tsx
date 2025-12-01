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
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                Welcome to Kasparex Hub
              </h1>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Your unified gateway to the Kasparex ecosystem. Explore modular dApps, media, games, publishing tools, and infrastructure built around Kaspa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dapps"
                  className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Explore dApps
                </Link>
                <Link
                  href="/points"
                  className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
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
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                Discover all current and upcoming projects in the Kasparex ecosystem
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
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed text-center">
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
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
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
              
              <div className="space-y-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <p>
                  Users can earn <strong className="text-zinc-900 dark:text-zinc-100">global reward tokens</strong> (for example, a global reward token like GRT) for using any dApp in the ecosystem, and <strong className="text-zinc-900 dark:text-zinc-100">local reward tokens</strong> that are specific to individual dApps or projects (LRTs).
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
                  href="/points"
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

