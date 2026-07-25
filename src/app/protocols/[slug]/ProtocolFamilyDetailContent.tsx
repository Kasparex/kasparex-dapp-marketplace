'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdSlider } from '@/components/ads/AdSlider';
import type { ProtocolFamily } from '@/lib/protocolFamilies';
import { ProtocolFamilySidebar } from '@/components/protocols/ProtocolFamilySidebar';
import { ProtocolHubCard } from '@/components/protocols/ProtocolHubCard';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HUB_HALO_DESKTOP_ONLY } from '@/lib/hub/haloHeaders';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { protocolHubItemsForFamilySlug, type ProtocolHubBucket, type ProtocolHubItem } from '@/lib/protocolsHub';

const KPX_API_ROWS: { title: string; href: string; description: string }[] = [
  {
    title: 'GET /api/kpx/spec',
    href: '/api/kpx/spec',
    description: 'Machine-readable field list and types for integrators.',
  },
  {
    title: 'POST /api/kpx/parse',
    href: '/api/kpx/parse',
    description: 'Validate a UTF-8 JSON payload (POST body) before broadcasting.',
  },
  {
    title: 'GET /api/kpx/pf/[addr]',
    href: '/api/kpx/spec',
    description: 'Latest indexed profile state for a Kaspa address (replace [addr]).',
  },
  {
    title: 'GET /api/kpx/ver/[addr] · /lnk/[addr] · /cm/[addr] · /cm/[addr]/summary',
    href: '/api/kpx/spec',
    description: 'Indexer snapshots for verified flag, EVM link, commits, and commit summaries.',
  },
];

function byBucket(items: ProtocolHubItem[], bucket: ProtocolHubBucket) {
  return items.filter((i) => i.bucket === bucket);
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-zinc-200 py-10 last:border-0 dark:border-zinc-800">
      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 sm:text-2xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function PlaceholderBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6 dark:border-zinc-700 dark:bg-zinc-900/40">
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}

export function ProtocolFamilyDetailContent({ family }: { family: ProtocolFamily }) {
  const items = protocolHubItemsForFamilySlug(family.slug);
  const tools = byBucket(items, 'tool');
  const useCases = byBucket(items, 'use-case');
  const docs = [...byBucket(items, 'documentation'), ...byBucket(items, 'protocol')];
  const implementations = byBucket(items, 'implementation').filter((i) => i.id !== 'kpx-machine-spec');
  const isMock = family.slug !== 'kpx';

  return (
    <div className={`flex min-h-screen flex-col ${HUB_PAGE_BG}`}>
      <Header />
      <main className={`flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row ${HUB_PAGE_BG}`}>
        <HubPageAccentLayout projectId="kasparex-protocols">
          <ProtocolFamilySidebar slug={family.slug} name={family.name} />

          <div className={HUB_MAIN_COLUMN}>
            <div className={HUB_MAIN_INNER}>
              <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                <Link href="/protocols" className="font-bold text-[color:var(--hub-accent)] hover:underline">
                  Protocols
                </Link>
                <span className="mx-2 text-zinc-400">/</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{family.name}</span>
              </nav>

              <div
                className={`relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-lime-50/40 px-6 py-10 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute right-0 top-0 h-[70%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)] blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-[50%] w-[40%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(132,204,22,0.12),transparent_70%)] blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-900 dark:text-[color:var(--hub-accent-light)]">
                      {family.status === 'live' ? 'Live' : family.status === 'preview' ? 'Preview' : 'Planned'}
                    </div>
                    <h1 className="text-3xl font-black leading-tight text-zinc-900 dark:text-white sm:text-4xl md:text-5xl">
                      {family.name}
                    </h1>
                    <p className="kx-body mt-3 max-w-2xl leading-relaxed">{family.description}</p>
                  </div>
                  <div className="relative hidden h-[160px] w-[200px] shrink-0 lg:block">
                    <div
                      id={`ad-slot-protocol-${family.slug}-halo`}
                      className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--hub-accent-border)] bg-gradient-to-br from-[color:var(--hub-accent)] to-teal-700 shadow-lg shadow-[color:var(--hub-accent-shadow)]"
                    >
                      <AdSlider slotId="HALO_PROTOCOLS_RIGHT" />
                    </div>
                  </div>
                </div>
              </div>

              <Section id="overview" title="Overview">
                {isMock ? (
                  <PlaceholderBlock
                    title="Roadmap"
                    body="This protocol family is in preview or planning. Sections below will fill in with tools, APIs, and documentation as specifications land."
                  />
                ) : (
                  <p className="kx-body max-w-2xl leading-relaxed">
                    KPX v1 defines small JSON payloads you attach to Kaspa transfers so indexers can recover identity, links,
                    verification state, and content fingerprints. Use the sections below to jump into tools, HTTP APIs, and
                    Knowledge Base articles.
                  </p>
                )}
              </Section>

              <Section id="tools" title="Tools">
                {isMock ? (
                  <PlaceholderBlock
                    title="No public tools yet"
                    body="Wallet flows, dashboards, and dApp modules will appear here as this protocol goes live."
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tools.map((item) => (
                      <ProtocolHubCard key={item.id} item={item} />
                    ))}
                    <div className="flex flex-col justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4 dark:border-zinc-600 dark:bg-zinc-900/50">
                      <div>
                        <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100">More modules</h3>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          Additional utilities, dApp integrations, and batch workflows will be listed here as they ship.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Section>

              <Section id="apis" title="APIs">
                {isMock ? (
                  <PlaceholderBlock title="API surface" body="OpenAPI-style references and route docs will publish with the specification." />
                ) : (
                  <div className="space-y-4">
                    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                      {KPX_API_ROWS.map((row) => (
                        <li key={row.title} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{row.title}</div>
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{row.description}</p>
                          </div>
                          <a href={row.href} className="shrink-0 text-sm font-bold text-[color:var(--hub-accent)] hover:underline">
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                    {implementations.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {implementations.map((item) => (
                          <ProtocolHubCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </Section>

              <Section id="use-cases" title="Use cases">
                {isMock ? (
                  <PlaceholderBlock title="Examples" body="Real-world integration stories will be added alongside the spec." />
                ) : useCases.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {useCases.map((item) => (
                      <ProtocolHubCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No use-case cards yet.</p>
                )}
              </Section>

              <Section id="docs" title="Docs">
                {isMock ? (
                  <PlaceholderBlock title="Knowledge Base" body="Long-form articles and tutorials will link from here." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                      href="/knowledge-base"
                      className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Knowledge Base</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Browse all Kasparex guides, including deep dives on kpx record types and security notes.
                      </p>
                      <span className="mt-3 inline-block text-sm font-bold text-[color:var(--hub-accent)]">Browse →</span>
                    </Link>
                    {docs.map((item) => (
                      <ProtocolHubCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </HubPageAccentLayout>
      </main>
      <Footer />
    </div>
  );
}
