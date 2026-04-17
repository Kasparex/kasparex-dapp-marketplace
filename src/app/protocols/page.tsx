import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

const PROTOCOLS = [
  {
    id: 'kpx',
    title: 'kpx',
    description: 'Kaspa-wide payload conventions for identity + creator commits (v1).',
    types: [
      { t: 'pf', name: 'Profile', version: 1, status: 'draft', kbSlug: 'kpx-v1-overview' },
      { t: 'ver', name: 'Verified badge', version: 1, status: 'draft', kbSlug: 'kpx-v1-verified-badge' },
      { t: 'lnk', name: 'Kaspa ↔ EVM link', version: 1, status: 'draft', kbSlug: 'kpx-v1-linking' },
      { t: 'cm', name: 'Commit (creator-owned resources)', version: 1, status: 'draft', kbSlug: 'kpx-v1-commits' },
    ],
  },
] as const;

export default function ProtocolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-10">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">Protocols</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Specifications supported by Kasparex. Each protocol is designed to be indexer-friendly and portable.
            </p>
          </div>

          <div className="space-y-6">
            {PROTOCOLS.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-[#02abb8]">{p.id}</div>
                    <div className="mt-1 text-xl font-black text-zinc-900 dark:text-zinc-100">{p.title}</div>
                    <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.description}</div>
                  </div>
                  <Link href="/knowledge-base" className="k-control-btn whitespace-nowrap">
                    Open Knowledge Base
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {p.types.map((t) => (
                    <Link
                      key={t.t}
                      href={`/knowledge-base/${t.kbSlug}`}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {p.id}/{t.t}
                        </div>
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.name}</div>
                      <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                        v{t.version}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

