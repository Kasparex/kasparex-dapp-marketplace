import Link from 'next/link';
import { HubDocPageShell } from '@/components/hub/HubDocPageShell';
import { HubLandingSidebar } from '@/components/hub/HubLandingSidebar';
import { ProjectCard } from '@/components/ProjectCard';
import { hubProjects } from '@/lib/hubProjects';

/** Hub marketing content is static; cache at the edge for faster first paint. */
export const revalidate = 3600;

export default function HubPage() {
  return (
    <HubDocPageShell
      projectId="kasparex-dapps"
      sidebar={
        <>
          <div className="hidden shrink-0 lg:block">
            <HubLandingSidebar />
          </div>
          <div className="lg:hidden">
            <HubLandingSidebar />
          </div>
        </>
      }
    >
      {/* Minimal welcome header */}
      <section id="hub-welcome" className="scroll-mt-24 relative mb-10 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.14),transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--k-primary)]">
            The Kasparex Ecosystem
          </p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Kasparex Hub
          </h1>
          <p className="kx-body mb-6 max-w-2xl leading-relaxed">
            Your unified gateway to the Kasparex ecosystem. Explore modular dApps, media, games, publishing tools, and infrastructure built around Kaspa.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/dapps" className="k-cta-primary w-full sm:w-auto justify-center text-xs py-2.5 px-5">
              Explore dApps
            </Link>
            <Link href="/rewards" className="k-cta-secondary w-full sm:w-auto justify-center text-xs py-2.5 px-5">
              View Rewards
            </Link>
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section id="hub-projects" className="scroll-mt-24 mb-14 sm:mb-16 lg:mb-20">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Explore Our Projects
          </h2>
          <p className="kx-body max-w-2xl">
            Discover projects across the Kasparex ecosystem. Cards summarize typical redeemable Hub pts tied to Rewards policy;
            authoritative numbers stay on Rewards → Points and History per wallet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hubProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Ecosystem Overview Section */}
      <section
        id="hub-ecosystem"
        className="scroll-mt-24 mb-14 sm:mb-16 lg:mb-20 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-6 py-10 sm:px-8 sm:py-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Kasparex Ecosystem Overview
        </h2>
        <p className="kx-body max-w-3xl">
          Kasparex is a unified hub of modular dApps, media, games, publishing tools and infrastructure built around Kaspa. Everything connects through wallet-based interactions, smart logic and on-chain actions. All these projects are designed to work together so that users, builders and creators can move between them smoothly, creating a seamless experience across the entire ecosystem.
        </p>
      </section>

      {/* Features Section */}
      <section id="hub-features" className="scroll-mt-24 mb-14 sm:mb-16 lg:mb-20">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Key Features
          </h2>
          <p className="kx-body max-w-2xl">What makes Kasparex unique</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="mb-3 h-0.5 w-8 rounded-full bg-[var(--k-primary)]" aria-hidden />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Modular dApps
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Reusable and combinable dApps that can be integrated and extended across the ecosystem.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="mb-3 h-0.5 w-8 rounded-full bg-[var(--k-primary)]" aria-hidden />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Wallet Native Interaction
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Transparent and real usage through wallet-based interactions that put you in control.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="mb-3 h-0.5 w-8 rounded-full bg-[var(--k-primary)]" aria-hidden />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Creator Infrastructure
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Publish music, posts and magazines using CIDs and IPFS-like storage for decentralized content.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="mb-3 h-0.5 w-8 rounded-full bg-[var(--k-primary)]" aria-hidden />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              One Unified Hub
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Everything collected in one place instead of many separate websites for a seamless experience.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits and Rewards Section */}
      <section
        id="hub-benefits"
        className="scroll-mt-24 mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-6 py-10 sm:px-8 sm:py-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-5">
          Benefits and Rewards
        </h2>

        <div className="space-y-5 kx-body max-w-3xl">
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

        <div className="mt-8">
          <Link href="/rewards" className="k-cta-primary inline-flex justify-center text-xs py-2.5 px-5">
            Learn More About Rewards
          </Link>
        </div>
      </section>
    </HubDocPageShell>
  );
}
