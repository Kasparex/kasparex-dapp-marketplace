'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  buildKpxCovenantExplorerLinkRows,
  buildKpxCovenantTemplateMetadataRows,
  type KpxCovenantMetadataInstance,
  type KpxCovenantMetadataRow,
} from '@/lib/covenant/kpxCovenantMetadata';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';

function toTableRows(rows: KpxCovenantMetadataRow[]): KxDataTableRow[] {
  return rows.map((row) => ({
    label: row.label,
    value: row.value,
    mono: row.mono,
    hint: row.hint,
    links: row.links,
  }));
}

function MetadataBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <DAppSectionHeader title={title} hint={description} className="!mb-0" />
      {children}
    </section>
  );
}

export function KpxCovenantMetadataView({
  template,
  runtimeMode,
  effectiveMode,
  instances,
  emptyMessage = 'No locks yet. Create one to see on-chain details here.',
  showInstances = true,
}: {
  template: CovenantTemplate;
  runtimeMode?: string;
  effectiveMode?: string;
  instances: KpxCovenantMetadataInstance[];
  emptyMessage?: string;
  showInstances?: boolean;
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

  const explorerRows = useMemo(
    () => buildKpxCovenantExplorerLinkRows(selected?.covenantId),
    [selected?.covenantId],
  );

  return (
    <div className="space-y-6">
      <MetadataBlock title="Product" description="What this dApp uses on Kaspa L1.">
        <KxDataTable rows={toTableRows(templateRows)} />
      </MetadataBlock>

      {showInstances ? (
        instances.length === 0 ? (
          <MetadataBlock title="Your locks">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
          </MetadataBlock>
        ) : (
          <MetadataBlock title="Selected lock" description="Pick a lock to see status, amounts, and explorer links.">
            {instances.length > 1 ? (
              <div>
                <label htmlFor="kpx-metadata-instance" className="k-label">
                  Select lock
                </label>
                <select
                  id="kpx-metadata-instance"
                  value={selected?.id ?? ''}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="k-input mt-1.5 w-full"
                >
                  {instances.map((instance) => (
                    <option key={instance.id} value={instance.id}>
                      {instance.title}
                      {instance.subtitle ? ` · ${instance.subtitle}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {selected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selected.title}</p>
                  {selected.subtitle ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{selected.subtitle}</p>
                  ) : null}
                </div>
                <KxDataTable rows={toTableRows(selected.rows)} />
              </div>
            ) : null}
          </MetadataBlock>
        )
      ) : (
        <MetadataBlock title="Lock details">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Open a card on the Vaults tab for status, amount, and explorer links.
          </p>
        </MetadataBlock>
      )}

      <MetadataBlock title="Explorers" description="Open the selected lock on Kaspa explorers when an on-chain ID exists.">
        <KxDataTable rows={toTableRows(explorerRows)} />
      </MetadataBlock>
    </div>
  );
}
