'use client';

import type { ReactNode } from 'react';

export type KxDataTableLink = {
  label: string;
  href: string;
  /** Prefer icon chrome; falls back from label when omitted. */
  icon?: 'explorer' | 'kaspacom' | 'kascov' | 'external';
};

export type KxDataTableRow = {
  label: string;
  value?: string;
  mono?: boolean;
  hint?: string;
  links?: KxDataTableLink[];
  valueNode?: ReactNode;
};

function resolveLinkIcon(link: KxDataTableLink): NonNullable<KxDataTableLink['icon']> {
  if (link.icon) return link.icon;
  const l = link.label.toLowerCase();
  if (l.includes('kascov')) return 'kascov';
  if (l.includes('kaspacom') || l === 'open') return 'kaspacom';
  if (l.includes('explorer')) return 'explorer';
  return 'external';
}

function LinkIcon({ kind }: { kind: NonNullable<KxDataTableLink['icon']> }) {
  const common = 'h-3.5 w-3.5';
  if (kind === 'explorer') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    );
  }
  if (kind === 'kascov') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    );
  }
  // kaspacom / external
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function TableLinkIcons({ links }: { links: KxDataTableLink[] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {links.map((link) => {
        const kind = resolveLinkIcon(link);
        return (
          <a
            key={`${link.label}-${link.href}`}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            aria-label={link.label}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 text-[color:var(--hub-accent)] transition-colors hover:border-[color:var(--hub-accent)] hover:bg-[color:var(--hub-accent-muted)] dark:border-zinc-700"
          >
            <LinkIcon kind={kind} />
          </a>
        );
      })}
    </span>
  );
}

/** Shared Hub key/value table. Links render as compact icons (not stacked text). */
export function KxDataTable({ rows, className = '' }: { rows: KxDataTableRow[]; className?: string }) {
  const visible = rows.filter(
    (row) => row.value?.trim() || row.valueNode || row.links?.length || row.hint?.trim(),
  );
  if (visible.length === 0) return null;

  return (
    <div
      className={`kx-metadata-stat-card overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-white/[0.06] ${className}`.trim()}
    >
      <table className="w-full border-collapse text-left text-sm">
        <tbody>
          {visible.map((row, index) => (
            <tr
              key={`${row.label}-${index}`}
              className="border-b border-zinc-200/60 align-middle last:border-b-0 dark:border-zinc-700/50"
            >
              <th
                scope="row"
                className="w-[28%] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                {row.label}
              </th>
              <td className="px-3 py-2 text-left text-zinc-800 dark:text-zinc-200">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-left">
                    {row.valueNode ? (
                      row.valueNode
                    ) : row.value ? (
                      <span
                        className={
                          row.mono
                            ? 'break-all font-mono text-xs leading-snug text-[color:var(--hub-accent)]'
                            : 'text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100'
                        }
                      >
                        {row.value}
                      </span>
                    ) : row.links?.length ? null : (
                      <span className="text-sm italic text-zinc-400 dark:text-zinc-500">
                        {row.hint ?? 'Not available'}
                      </span>
                    )}
                    {!row.value && row.links?.length && row.hint ? (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{row.hint}</p>
                    ) : null}
                  </div>
                  {row.links?.length ? <TableLinkIcons links={row.links} /> : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
