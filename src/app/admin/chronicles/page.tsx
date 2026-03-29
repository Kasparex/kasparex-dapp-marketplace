'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdmin } from '@/hooks/useAdmin';
import {
  getChapterSummaries,
  getAllCharacters,
  getAllLocations,
  getAllVehicles,
  getFragments,
} from '@/lib/chronicles/loaders';

export const dynamic = 'force-dynamic';

export default function AdminChroniclesPage() {
  const { isAdmin, isConnected } = useAdmin();
  const chapters = getChapterSummaries();
  const characters = getAllCharacters();
  const locations = getAllLocations();
  const vehicles = getAllVehicles();
  const fragments = getFragments();

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl font-black mb-4 text-zinc-900 dark:text-zinc-100">Chronicles admin</h1>
          <p className="text-zinc-500 mb-8">Admin wallet required.</p>
          <Link href="/admin" className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold">
            Back to Admin
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                Krex&apos;s Chronicles <span className="text-[#02abb8]">Admin</span>
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                Read-only overview. Content lives in <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 rounded">data/chronicles/</code> — edit JSON
                and markdown bodies in the repo, then deploy.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/40">
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{chapters.length}</p>
                  <p className="text-sm text-zinc-500">Chapters (published)</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/40">
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{characters.length}</p>
                  <p className="text-sm text-zinc-500">Characters / factions</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/40">
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{locations.length}</p>
                  <p className="text-sm text-zinc-500">Locations</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/40">
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{vehicles.length}</p>
                  <p className="text-sm text-zinc-500">Vehicles &amp; tech</p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/40 mb-8">
                <h2 className="font-black text-zinc-900 dark:text-zinc-100 mb-3">Chapters</h2>
                <ul className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
                  {chapters.map((c) => (
                    <li key={c.slug} className="flex justify-between gap-4">
                      <span>
                        {c.number}. {c.title}{' '}
                        <span className="text-zinc-400">({c.status}, {c.timeline})</span>
                      </span>
                      <Link href={`/chronicles/chapters/${c.slug}`} className="text-[#02abb8] font-bold shrink-0">
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/40 mb-8">
                <h2 className="font-black text-zinc-900 dark:text-zinc-100 mb-3">Codex fragments</h2>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400">
                  {fragments.map((f) => (
                    <li key={f.id}>{f.title}</li>
                  ))}
                </ul>
              </div>

              <Link href="/chronicles" className="inline-flex font-bold text-[#02abb8] hover:underline">
                Open public Chronicles →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
