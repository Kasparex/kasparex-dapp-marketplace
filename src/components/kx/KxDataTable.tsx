'use client';

import type { ReactNode } from 'react';

export type KxDataTableRow = {
  label: string;
  value?: string;
  mono?: boolean;
  hint?: string;
  links?: { label: string; href: string }[];
  valueNode?: ReactNode;
};

function TableLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
      {links.map((link) => (
        <a
          key={`${link.label}-${link.href}`}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[color:var(--hub-accent)] hover:underline"
        >
          {link.label}
        </a>
      ))}
    </span>
  );
}

/** Shared Hub key/value table (Store Info, dApp metadata-style rows). Left-aligned; mono for ids. */
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
          {visible.map((row) => (
            <tr
              key={row.label}
              className="border-b border-zinc-200/60 align-top last:border-b-0 dark:border-zinc-700/50"
            >
              <th
                scope="row"
                className="w-[36%] px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                {row.label}
              </th>
              <td className="px-3 py-2.5 text-left text-zinc-800 dark:text-zinc-200">
                {row.valueNode ? (
                  <div className="text-left">{row.valueNode}</div>
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
                {row.links?.length ? (
                  <div className={row.value ? 'mt-1.5' : ''}>
                    <TableLinks links={row.links} />
                  </div>
                ) : null}
                {!row.value && row.links?.length && row.hint ? (
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{row.hint}</p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
