'use client';

import Link from 'next/link';
import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { StatusIndicator } from './dapps/StatusIndicator';
import { mergeDAppData } from '@/lib/dapps/contractData';

interface DAppTableProps {
  dapps: DApp[];
}

export function DAppTable({ dapps }: DAppTableProps) {
  if (dapps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No dApps found in this category.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Name</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Category</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Network</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Version</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">ID</th>
          </tr>
        </thead>
        <tbody>
          {dapps.map((dapp) => {
            const mergedDApp = mergeDAppData(null, dapp);
            const category = getCategoryById(mergedDApp.category);
            const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);
            
            return (
              <tr
                key={dapp.id}
                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/dapps/${slug}`}
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] dark:hover:text-[#02abb8] transition-colors"
                  >
                    {mergedDApp.name}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  {category && (
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {category.emoji} {category.name}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <StatusIndicator dapp={mergedDApp} size="sm" clickable={false} />
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {mergedDApp.status || 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {mergedDApp.version && mergedDApp.version !== 'N/A' 
                      ? mergedDApp.version.replace(/^v\s*/i, '')
                      : 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {mergedDApp.id}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

