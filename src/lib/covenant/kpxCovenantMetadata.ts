/**
 * Unified KPX covenant metadata rows for the Metadata tab.
 */

import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  kaspaComCovenantExplorerBase,
  kaspaComCovenantExplorerUrl,
  kaspaComIndexerBase,
  kaspaComTxExplorerUrl,
  kascovCovenantExplorerUrl,
} from '@/lib/programmable/config';
import { getKpxCovenantBrand } from './kpxBranding';
import type { CovenantVault } from './types';
import { resolveVaultClaimers } from './participants';
import type { SplitPayment } from './split-types';
import type { MilestoneDeal } from './milestone-types';
import type { CrowdfundCampaign } from './crowdfund-types';
import type { VoucherLock } from './voucher-types';
import { getExplorerTxUrl, getKaspaExplorerAddressUrl } from '@/lib/store/utils';

export type KpxCovenantMetadataLink = {
  label: string;
  href: string;
};

export type KpxCovenantMetadataRow = {
  label: string;
  value?: string;
  mono?: boolean;
  links?: KpxCovenantMetadataLink[];
  hint?: string;
};

export type KpxCovenantMetadataInstance = {
  id: string;
  title: string;
  subtitle?: string;
  rows: KpxCovenantMetadataRow[];
};

const network = DEFAULT_PROGRAMMABLE_NETWORK;

export function isOnChainCovenantId(covenantId: string): boolean {
  return /^[a-f0-9]{64}$/i.test(covenantId.trim());
}

function sompiToKasLabel(sompi: string): string {
  const n = Number(BigInt(sompi)) / 1e8;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 8 })} KAS`;
}

function formatTs(ms: number | null | undefined): string | undefined {
  if (!ms) return undefined;
  return new Date(ms).toLocaleString();
}

function row(label: string, value?: string, opts?: Partial<KpxCovenantMetadataRow>): KpxCovenantMetadataRow {
  if (!value?.trim()) {
    return { label, value: undefined, hint: opts?.hint ?? 'Not available yet', ...opts };
  }
  return { label, value, ...opts };
}

function addressRow(label: string, address?: string): KpxCovenantMetadataRow {
  if (!address?.trim()) return row(label, undefined);
  return {
    label,
    value: address,
    mono: true,
    links: [{ label: 'Kaspa Explorer', href: getKaspaExplorerAddressUrl(address) }],
  };
}

function txRow(label: string, txHash?: string): KpxCovenantMetadataRow {
  if (!txHash?.trim()) return row(label, undefined);
  const id = txHash.trim().toLowerCase();
  return {
    label,
    value: id,
    mono: true,
    links: [
      { label: 'KaspaCom', href: kaspaComTxExplorerUrl(id, network) },
      { label: 'Kaspa Explorer', href: getExplorerTxUrl(id) },
    ],
  };
}

function covenantIdRow(covenantId?: string): KpxCovenantMetadataRow {
  if (!covenantId?.trim()) return row('Covenant ID', undefined);
  const id = covenantId.trim().toLowerCase();
  if (!isOnChainCovenantId(id)) {
    return {
      label: 'Covenant ID',
      value: id,
      mono: true,
      hint: 'Local or pending id. Import a 64-char on-chain covenant id to link explorers.',
    };
  }
  return {
    label: 'Covenant ID',
    value: id,
    mono: true,
    links: [
      { label: 'KaspaCom', href: kaspaComCovenantExplorerUrl(id, network) },
      { label: 'kascov', href: kascovCovenantExplorerUrl(id, network) },
    ],
  };
}

function utxoRow(utxo?: { txId: string; index: number }): KpxCovenantMetadataRow {
  if (!utxo?.txId) return row('Covenant UTXO', undefined);
  return {
    label: 'Covenant UTXO',
    value: `${utxo.txId}:${utxo.index}`,
    mono: true,
    links: [{ label: 'Funding tx (KaspaCom)', href: kaspaComTxExplorerUrl(utxo.txId, network) }],
  };
}

export function buildKpxCovenantTemplateMetadataRows(args: {
  template: CovenantTemplate;
  runtimeMode?: string;
  effectiveMode?: string;
}): KpxCovenantMetadataRow[] {
  const brand = getKpxCovenantBrand(args.template);
  return [
    row('Product', brand.displayName),
    row('Payload template', brand.payloadTemplate, { mono: true }),
    row('Network', network),
    row('Configured runtime', args.runtimeMode ?? 'hybrid'),
    row('Active runtime', args.effectiveMode ?? args.runtimeMode ?? 'simulator'),
    row('KaspaCom indexer', kaspaComIndexerBase(network), {
      mono: true,
      links: [{ label: 'Open indexer', href: kaspaComIndexerBase(network) }],
    }),
    row('Covenant explorer', kaspaComCovenantExplorerBase(network), {
      mono: true,
      links: [{ label: 'Open explorer', href: kaspaComCovenantExplorerBase(network) }],
    }),
  ];
}

export function buildKpxCovenantExplorerLinkRows(covenantId?: string): KpxCovenantMetadataRow[] {
  const id = covenantId?.trim().toLowerCase();
  if (!id || !isOnChainCovenantId(id)) {
    return [
      row('Instance explorers', undefined, {
        hint: 'Select an on-chain covenant instance to open KaspaCom and kascov links.',
      }),
    ];
  }
  return [
    {
      label: 'KaspaCom covenant',
      links: [{ label: 'View covenant', href: kaspaComCovenantExplorerUrl(id, network) }],
    },
    {
      label: 'kascov covenant',
      links: [{ label: 'View covenant', href: kascovCovenantExplorerUrl(id, network) }],
    },
  ];
}

export function lockboxMetadataInstances(vaults: CovenantVault[]): KpxCovenantMetadataInstance[] {
  return vaults.map((v) => ({
    id: v.id,
    title: v.memo?.trim() || `Lock ${sompiToKasLabel(v.amountSompi)}`,
    subtitle: `${v.kind} · ${v.status}`,
    rows: [
      row('Local instance id', v.id, { mono: true }),
      covenantIdRow(v.covenantId),
      row('Status', v.status),
      row('Lock type', v.kind),
      row('Memo', v.memo?.trim() || undefined, { hint: v.memo?.trim() ? undefined : 'No memo' }),
      row('Amount locked', sompiToKasLabel(v.amountSompi)),
      addressRow('Depositor', v.depositor),
      addressRow('Primary claimer', v.beneficiary),
      row(
        'All claimers',
        resolveVaultClaimers(v).length > 1
          ? resolveVaultClaimers(v).join('\n')
          : undefined,
        {
          mono: true,
          hint: resolveVaultClaimers(v).length > 1 ? undefined : 'Single claimer',
        },
      ),
      row('Unlock rule', v.unlockAt ? formatTs(v.unlockAt) : 'Anytime (escrow)'),
      row('Created', formatTs(v.createdAt)),
      row('Claimed', formatTs(v.claimedAt)),
      txRow('Lock transaction', v.lockTxHash ?? v.utxo?.txId),
      txRow('Claim transaction', v.claimTxHash),
      utxoRow(v.utxo),
    ],
  }));
}

export function splitMetadataInstances(splits: SplitPayment[]): KpxCovenantMetadataInstance[] {
  return splits.map((s) => ({
    id: s.id,
    title: s.memo?.trim() || `Split ${sompiToKasLabel(s.totalSompi)}`,
    subtitle: `${s.status} · ${s.recipients.length} recipients`,
    rows: [
      row('Local instance id', s.id, { mono: true }),
      covenantIdRow(s.covenantId),
      row('Status', s.status),
      row('Total locked', sompiToKasLabel(s.totalSompi)),
      addressRow('Depositor', s.depositor),
      row('Recipients', String(s.recipients.length)),
      row('Created', formatTs(s.createdAt)),
      txRow('Lock transaction', s.lockTxHash),
      ...s.recipients.flatMap((r, i) => [
        row(`Recipient ${i + 1} address`, r.address, {
          mono: true,
          links: [{ label: 'Kaspa Explorer', href: getKaspaExplorerAddressUrl(r.address) }],
        }),
        row(`Recipient ${i + 1} share`, `${(r.shareBps / 100).toFixed(2)}% (${sompiToKasLabel(r.amountSompi)})`),
        row(`Recipient ${i + 1} claimed`, r.claimed ? formatTs(r.claimedAt) ?? 'Yes' : 'No'),
        txRow(`Recipient ${i + 1} claim tx`, r.claimTxHash),
      ]),
    ],
  }));
}

export function milestoneMetadataInstances(deals: MilestoneDeal[]): KpxCovenantMetadataInstance[] {
  return deals.map((d) => ({
    id: d.id,
    title: d.memo?.trim() || `Milestone ${sompiToKasLabel(d.totalSompi)}`,
    subtitle: `${d.status} · ${d.milestones.length} steps`,
    rows: [
      row('Local instance id', d.id, { mono: true }),
      covenantIdRow(d.covenantId),
      row('Status', d.status),
      row('Total locked', sompiToKasLabel(d.totalSompi)),
      addressRow('Depositor', d.depositor),
      addressRow('Beneficiary', d.beneficiary),
      row('Created', formatTs(d.createdAt)),
      txRow('Lock transaction', d.lockTxHash),
      ...d.milestones.flatMap((m, i) => [
        row(`Milestone ${i + 1}`, m.label),
        row(`Milestone ${i + 1} amount`, sompiToKasLabel(m.amountSompi)),
        row(`Milestone ${i + 1} unlock`, formatTs(m.unlockAt)),
        row(`Milestone ${i + 1} claimed`, m.claimed ? formatTs(m.claimedAt) ?? 'Yes' : 'No'),
      ]),
    ],
  }));
}

export function crowdfundMetadataInstances(campaigns: CrowdfundCampaign[]): KpxCovenantMetadataInstance[] {
  return campaigns.map((c) => ({
    id: c.id,
    title: c.title?.trim() || 'Crowdfund campaign',
    subtitle: `${c.status} · ${sompiToKasLabel(c.raisedSompi)} / ${sompiToKasLabel(c.goalSompi)}`,
    rows: [
      row('Local instance id', c.id, { mono: true }),
      covenantIdRow(c.covenantId),
      row('Status', c.status),
      row('Goal', sompiToKasLabel(c.goalSompi)),
      row('Raised', sompiToKasLabel(c.raisedSompi)),
      addressRow('Creator', c.creator),
      row('Deadline', formatTs(c.deadline)),
      row('Pledges', String(c.pledges.length)),
      row('Created', formatTs(c.createdAt)),
      row('Claimed', formatTs(c.claimedAt)),
      ...c.pledges.flatMap((p, i) => [
        addressRow(`Pledge ${i + 1} backer`, p.backer),
        row(`Pledge ${i + 1} amount`, sompiToKasLabel(p.amountSompi)),
        txRow(`Pledge ${i + 1} tx`, p.txHash),
        row(`Pledge ${i + 1} refunded`, p.refunded ? 'Yes' : 'No'),
      ]),
    ],
  }));
}

export function voucherMetadataInstances(vouchers: VoucherLock[]): KpxCovenantMetadataInstance[] {
  return vouchers.map((v) => ({
    id: v.id,
    title: v.memo?.trim() || `Voucher ${sompiToKasLabel(v.amountSompi)}`,
    subtitle: `${v.status}`,
    rows: [
      row('Local instance id', v.id, { mono: true }),
      covenantIdRow(v.covenantId),
      row('Status', v.status),
      row('Amount', sompiToKasLabel(v.amountSompi)),
      addressRow('Creator', v.creator),
      addressRow('Claimed by', v.claimedBy ?? undefined),
      row('Expires', formatTs(v.expiresAt)),
      row('Created', formatTs(v.createdAt)),
      row('Claimed', formatTs(v.claimedAt)),
      row('Secret hash', v.secretHash, { mono: true }),
      txRow('Lock transaction', v.lockTxHash),
    ],
  }));
}
