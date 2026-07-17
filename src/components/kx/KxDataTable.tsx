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
          className="text-xs font-medium text-[#02abb8] hover:underline"
        >
          {link.label}
        </a>
      ))}
    </span>
  );
}

export function KxDataTable({ rows, className = '' }: { rows: KxDataTableRow[]; className?: string }) {
  const visible = rows.filter(
    (row) => row.value?.trim() || row.valueNode || row.links?.length || row.hint?.trim(),
  );
  if (visible.length === 0) return null;

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${className}`.trim()}
    >
      <table className="w-full border-collapse text-sm">
        <tbody>
          {visible.map((row) => (
            <tr
              key={row.label}
              className="border-b border-zinc-200/50 align-top last:border-b-0 dark:border-zinc-700/50"
            >
              <th
                scope="row"
                className="w-[36%] px-3 py-2.5 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300"
              >
                {row.label}
              </th>
              <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">
                {row.valueNode ? (
                  row.valueNode
                ) : row.value ? (
                  <span className={row.mono ? 'font-mono text-xs break-all' : 'text-sm'}>
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
