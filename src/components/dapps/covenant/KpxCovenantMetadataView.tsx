'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  buildKpxCovenantExplorerLinkRows,
  buildKpxCovenantTemplateMetadataRows,
  type KpxCovenantMetadataInstance,
  type KpxCovenantMetadataLink,
  type KpxCovenantMetadataRow,
} from '@/lib/covenant/kpxCovenantMetadata';
import { covenantPanelClass } from '@/components/dapps/covenant/CovenantWidgetUi';

function MetadataLinks({ links }: { links: KpxCovenantMetadataLink[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
      {links.map((link) => (
        <a
          key={`${link.label}-${link.href}`}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#02abb8] hover:underline text-xs font-medium"
        >
          {link.label}
        </a>
      ))}
    </span>
  );
}

function MetadataTable({ rows }: { rows: KpxCovenantMetadataRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 align-top"
            >
              <th
                scope="row"
                className="w-[38%] sm:w-[34%] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-900/60"
              >
                {row.label}
              </th>
              <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">
                {row.value ? (
                  <span className={row.mono ? 'font-mono text-xs break-all' : ''}>{row.value}</span>
                ) : row.links?.length ? null : (
                  <span className="text-zinc-400 dark:text-zinc-500 italic">
                    {row.hint ?? 'Not available'}
                  </span>
                )}
                {row.links?.length ? (
                  <div className={row.value ? 'mt-1.5' : ''}>
                    <MetadataLinks links={row.links} />
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

function MetadataSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${covenantPanelClass} space-y-3`}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {description ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function KpxCovenantMetadataView({
  template,
  runtimeMode,
  effectiveMode,
  instances,
  emptyMessage = 'No covenant instances yet. Create one or import by covenant ID to populate on-chain references.',
}: {
  template: CovenantTemplate;
  runtimeMode?: string;
  effectiveMode?: string;
  instances: KpxCovenantMetadataInstance[];
  emptyMessage?: string;
}) {
  const [selectedId, setSelectedId] = useState(instances[0]?.id ?? '');

  useEffect(() => {
    if (!instances.some((i) => i.id === selectedId)) {
      setSelectedId(instances[0]?.id ?? '');
    }
  }, [instances, selectedId]);

  const selected = useMemo(
    () => instances.find((i) => i.id === selectedId) ?? instances[0],
    [instances, selectedId],
  );

  const templateRows = useMemo(
    () => buildKpxCovenantTemplateMetadataRows({ template, runtimeMode, effectiveMode }),
    [template, runtimeMode, effectiveMode],
  );

  const selectedCovenantId = selected?.rows.find((r) => r.label === 'Covenant ID')?.value;
  const explorerRows = useMemo(
    () => buildKpxCovenantExplorerLinkRows(selectedCovenantId),
    [selectedCovenantId],
  );

  return (
    <div className="space-y-4">
      <MetadataSection
        title="Template and runtime"
        description="Standard KPX covenant identifiers and the active execution mode for this widget."
      >
        <MetadataTable rows={templateRows} />
      </MetadataSection>

      <MetadataSection
        title="Explorers and indexers"
        description="Open the selected instance on KaspaCom, kascov, or the public Kaspa explorer."
      >
        <MetadataTable rows={explorerRows} />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Covenant IDs must be 64-char hex to link indexers. Transaction hashes open on KaspaCom and{' '}
          <Link
            href="https://explorer.kaspa.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02abb8] hover:underline"
          >
            explorer.kaspa.org
          </Link>
          .
        </p>
      </MetadataSection>

      {instances.length === 0 ? (
        <MetadataSection title="Covenant instances">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
        </MetadataSection>
      ) : (
        <MetadataSection
          title="Covenant instance"
          description="Technical metadata for a lock, split, campaign, or voucher tracked in this browser."
        >
          {instances.length > 1 ? (
            <div>
              <label htmlFor="kpx-metadata-instance" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Select instance
              </label>
              <select
                id="kpx-metadata-instance"
                value={selected?.id ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {instances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.title}
                    {instance.subtitle ? ` (${instance.subtitle})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selected ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selected.title}</p>
                {selected.subtitle ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selected.subtitle}</p>
                ) : null}
              </div>
              <MetadataTable rows={selected.rows} />
            </div>
          ) : null}
        </MetadataSection>
      )}
    </div>
  );
}
