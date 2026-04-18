'use client';

import Link from 'next/link';
import type { ProtocolFamily } from '@/lib/protocolFamilies';

function statusBadge(status: ProtocolFamily['status']) {
  switch (status) {
    case 'live':
      return 'border-white/50 bg-white/15 text-white';
    case 'preview':
      return 'border-white/40 bg-black/20 text-white';
    default:
      return 'border-white/35 bg-black/15 text-white/90';
  }
}

function statusLabel(status: ProtocolFamily['status']) {
  switch (status) {
    case 'live':
      return 'Live';
    case 'preview':
      return 'Preview';
    default:
      return 'Planned';
  }
}

export function ProtocolFamilyCard({ family }: { family: ProtocolFamily }) {
  return (
    <Link
      href={`/protocols/${family.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-[#02abb8]/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-[#02abb8]/35"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#02abb8] via-cyan-600 to-teal-700 px-6 py-10 dark:from-[#02919c] dark:via-cyan-700 dark:to-teal-900">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-1/4 h-24 w-40 rounded-full bg-black/10 blur-xl" />
        </div>
        <div className="relative flex items-end justify-between gap-4">
          <span className="text-4xl font-black tracking-tight text-white drop-shadow-sm sm:text-5xl">{family.shortLabel}</span>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusBadge(family.status)}`}
          >
            {statusLabel(family.status)}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{family.name}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{family.description}</p>
        <div className="mt-4 text-sm font-bold text-[#02abb8] group-hover:underline">View protocol hub →</div>
      </div>
    </Link>
  );
}
