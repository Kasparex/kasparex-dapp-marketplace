'use client';

import { KxModalShell } from '@/components/ui/KxModalShell';
import { KxModalHeader, KxModalSectionTitle } from '@/components/payments/KxPaymentUi';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';
import type { KpxCovenantMetadataInstance, KpxCovenantMetadataRow } from '@/lib/covenant/kpxCovenantMetadata';

function toTableRows(rows: KpxCovenantMetadataRow[]): KxDataTableRow[] {
  return rows.map((row) => ({
    label: row.label,
    value: row.value,
    mono: row.mono,
    hint: row.hint,
    links: row.links,
  }));
}

/** Shared detail modal for Lockbox / Split / Milestone / Crowdfund / Voucher instances. */
export function CovenantInstanceDetailModal({
  instance,
  sectionTitle = 'Details',
  onClose,
}: {
  instance: KpxCovenantMetadataInstance;
  sectionTitle?: string;
  onClose: () => void;
}) {
  return (
    <KxModalShell
      isOpen
      onClose={onClose}
      panelClassName="max-w-lg max-h-[min(90vh,720px)] flex flex-col"
    >
      <KxModalHeader
        title={instance.title}
        subtitle={instance.subtitle}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
        <KxModalSectionTitle>{sectionTitle}</KxModalSectionTitle>
        <KxDataTable rows={toTableRows(instance.rows)} />
      </div>
    </KxModalShell>
  );
}

/** @deprecated Prefer CovenantInstanceDetailModal */
export function LockboxVaultDetailModal({
  instance,
  onClose,
}: {
  instance: KpxCovenantMetadataInstance;
  onClose: () => void;
}) {
  return (
    <CovenantInstanceDetailModal
      instance={instance}
      sectionTitle="Vault metadata"
      onClose={onClose}
    />
  );
}
