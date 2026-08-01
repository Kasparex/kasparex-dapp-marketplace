/**
 * Simplified KPX covenant metadata for detail modals and the Metadata tab.
 */

import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  kaspaComCovenantExplorerUrl,
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
  icon?: 'explorer' | 'kaspacom' | 'kascov' | 'external';
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
  /** Full on-chain covenant id when known (for explorer links). */
  covenantId?: string;
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

function shortAddr(address: string): string {
  const a = address.trim();
  if (a.length <= 18) return a;
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

function shortId(id: string): string {
  const v = id.trim().toLowerCase();
  if (v.length <= 18) return v;
  return `${v.slice(0, 10)}…${v.slice(-8)}`;
}

function row(label: string, value?: string, opts?: Partial<KpxCovenantMetadataRow>): KpxCovenantMetadataRow {
  if (!value?.trim()) return { label, ...opts };
  return { label, value, ...opts };
}

function addressRow(label: string, address?: string): KpxCovenantMetadataRow {
  if (!address?.trim()) return row(label);
  return {
    label,
    value: shortAddr(address),
    mono: true,
    links: [{ label: 'Explorer', href: getKaspaExplorerAddressUrl(address), icon: 'explorer' }],
  };
}

function txRow(label: string, txHash?: string): KpxCovenantMetadataRow {
  if (!txHash?.trim() || !/^[a-f0-9]{64}$/i.test(txHash.trim())) return row(label);
  const id = txHash.trim().toLowerCase();
  return {
    label,
    value: shortId(id),
    mono: true,
    links: [
      { label: 'KaspaCom', href: kaspaComTxExplorerUrl(id, network), icon: 'kaspacom' },
      { label: 'Explorer', href: getExplorerTxUrl(id), icon: 'explorer' },
    ],
  };
}

function covenantIdRow(covenantId?: string): KpxCovenantMetadataRow {
  if (!covenantId?.trim()) return row('Covenant ID');
  const id = covenantId.trim().toLowerCase();
  if (!isOnChainCovenantId(id)) return row('Covenant ID');
  return {
    label: 'Covenant ID',
    value: shortId(id),
    mono: true,
    links: [
      { label: 'KaspaCom', href: kaspaComCovenantExplorerUrl(id, network), icon: 'kaspacom' },
      { label: 'kascov', href: kascovCovenantExplorerUrl(id, network), icon: 'kascov' },
    ],
  };
}

function shareLinks(args: {
  address?: string;
  lockTx?: string;
}): KpxCovenantMetadataLink[] {
  const links: KpxCovenantMetadataLink[] = [];
  if (args.address?.trim()) {
    links.push({
      label: 'Explorer',
      href: getKaspaExplorerAddressUrl(args.address),
      icon: 'explorer',
    });
  }
  const tx = args.lockTx?.trim().toLowerCase();
  if (tx && /^[a-f0-9]{64}$/i.test(tx)) {
    links.push({ label: 'KaspaCom', href: kaspaComTxExplorerUrl(tx, network), icon: 'kaspacom' });
    links.push({ label: 'Tx', href: getExplorerTxUrl(tx), icon: 'external' });
  }
  return links;
}

export function buildKpxCovenantTemplateMetadataRows(args: {
  template: CovenantTemplate;
  runtimeMode?: string;
  effectiveMode?: string;
}): KpxCovenantMetadataRow[] {
  const brand = getKpxCovenantBrand(args.template);
  return [
    row('Product', brand.displayName),
    row('Network', network === 'mainnet' ? 'Kaspa mainnet' : network),
  ];
}

export function buildKpxCovenantExplorerLinkRows(covenantId?: string): KpxCovenantMetadataRow[] {
  const id = covenantId?.trim().toLowerCase();
  if (!id || !isOnChainCovenantId(id)) {
    return [
      row('Explorers', undefined, {
        hint: 'Open an instance with an on-chain covenant ID to see explorer links.',
      }),
    ];
  }
  return [
    {
      label: 'KaspaCom',
      links: [{ label: 'KaspaCom', href: kaspaComCovenantExplorerUrl(id, network), icon: 'kaspacom' }],
    },
    {
      label: 'kascov',
      links: [{ label: 'kascov', href: kascovCovenantExplorerUrl(id, network), icon: 'kascov' }],
    },
  ];
}

export function lockboxMetadataInstances(vaults: CovenantVault[]): KpxCovenantMetadataInstance[] {
  return vaults.map((v) => {
    const claimers = resolveVaultClaimers(v);
    return {
      id: v.id,
      title: v.memo?.trim() || `Lock ${sompiToKasLabel(v.amountSompi)}`,
      subtitle: `${v.kind} · ${v.status}`,
      covenantId: isOnChainCovenantId(v.covenantId) ? v.covenantId : undefined,
      rows: [
        row('Status', v.status),
        row('Amount', sompiToKasLabel(v.amountSompi)),
        row('Type', v.kind === 'timelock' ? 'Timelock' : 'Escrow'),
        row('Unlock', v.unlockAt ? formatTs(v.unlockAt) : 'Anytime'),
        row('Deadline', v.deadlineAt ? formatTs(v.deadlineAt) : undefined),
        addressRow(claimers.length > 1 ? 'Primary claimer' : 'Claimer', v.beneficiary),
        claimers.length > 1
          ? row('Claimers', `${claimers.length} wallets`)
          : row('Claimers'),
        row('Memo', v.memo?.trim() || undefined),
        covenantIdRow(v.covenantId),
        txRow('Lock tx', v.lockTxHash ?? v.utxo?.txId),
        txRow('Claim tx', v.claimTxHash),
      ].filter((r) => r.value || r.links?.length),
    };
  });
}

export function splitMetadataInstances(splits: SplitPayment[]): KpxCovenantMetadataInstance[] {
  return splits.map((s) => {
    const claimed = s.recipients.filter((r) => r.claimed).length;
    return {
      id: s.id,
      title: s.memo?.trim() || `Split ${sompiToKasLabel(s.totalSompi)}`,
      subtitle: `${s.status} · ${claimed}/${s.recipients.length} claimed`,
      covenantId: isOnChainCovenantId(s.covenantId) ? s.covenantId : undefined,
      rows: [
        row('Status', s.status),
        row('Total', sompiToKasLabel(s.totalSompi)),
        addressRow('From', s.depositor),
        row('Memo', s.memo?.trim() || undefined),
        covenantIdRow(s.covenantId),
        ...s.recipients.map((r, i) => {
          const lockTx = r.lockTxHash ?? r.utxo?.txId;
          const status = r.claimed ? 'claimed' : 'open';
          return {
            label: `Share ${i + 1}`,
            value: `${shortAddr(r.address)} · ${(r.shareBps / 100).toFixed(1)}% · ${sompiToKasLabel(r.amountSompi)} · ${status}`,
            mono: true,
            links: shareLinks({ address: r.address, lockTx }),
          };
        }),
      ].filter((r) => r.value || r.links?.length),
    };
  });
}

export function milestoneMetadataInstances(deals: MilestoneDeal[]): KpxCovenantMetadataInstance[] {
  return deals.map((d) => {
    const claimed = d.milestones.filter((m) => m.claimed).length;
    return {
      id: d.id,
      title: d.memo?.trim() || `Milestone ${sompiToKasLabel(d.totalSompi)}`,
      subtitle: `${d.status} · ${claimed}/${d.milestones.length} claimed`,
      covenantId: isOnChainCovenantId(d.covenantId) ? d.covenantId : undefined,
      rows: [
        row('Status', d.status),
        row('Total', sompiToKasLabel(d.totalSompi)),
        addressRow('From', d.depositor),
        addressRow('Beneficiary', d.beneficiary),
        row('Memo', d.memo?.trim() || undefined),
        covenantIdRow(d.covenantId),
        ...d.milestones.map((m, i) => {
          const lockTx = m.lockTxHash ?? m.utxo?.txId;
          const status = m.reclaimed ? 'reclaimed' : m.claimed ? 'claimed' : 'open';
          const unlock = formatTs(m.unlockAt);
          return {
            label: `Step ${i + 1}`,
            value: `${m.label} · ${sompiToKasLabel(m.amountSompi)} · ${status}${unlock ? ` · ${unlock}` : ''}`,
            mono: false,
            links: shareLinks({ lockTx }),
          };
        }),
      ].filter((r) => r.value || r.links?.length),
    };
  });
}

export function crowdfundMetadataInstances(campaigns: CrowdfundCampaign[]): KpxCovenantMetadataInstance[] {
  return campaigns.map((c) => {
    const activePledges = c.pledges.filter((p) => !p.refunded);
    return {
      id: c.id,
      title: c.title?.trim() || 'Crowdfund',
      subtitle: `${c.status} · ${sompiToKasLabel(c.raisedSompi)} / ${sompiToKasLabel(c.goalSompi)}`,
      covenantId: isOnChainCovenantId(c.covenantId) ? c.covenantId : undefined,
      rows: [
        row('Status', c.status),
        row('Raised', `${sompiToKasLabel(c.raisedSompi)} / ${sompiToKasLabel(c.goalSompi)}`),
        addressRow('Creator', c.creator),
        row('Deadline', formatTs(c.deadline)),
        row('Memo', c.memo?.trim() || undefined),
        covenantIdRow(c.covenantId),
        ...activePledges.slice(0, 8).map((p, i) => {
          const tx = p.txHash ?? p.utxo?.txId;
          return {
            label: `Pledge ${i + 1}`,
            value: `${shortAddr(p.backer)} · ${sompiToKasLabel(p.amountSompi)}`,
            mono: true,
            links: shareLinks({ address: p.backer, lockTx: tx }),
          };
        }),
      ].filter((r) => r.value || r.links?.length),
    };
  });
}

export function voucherMetadataInstances(vouchers: VoucherLock[]): KpxCovenantMetadataInstance[] {
  return vouchers.map((v) => ({
    id: v.id,
    title: v.memo?.trim() || `Voucher ${sompiToKasLabel(v.amountSompi)}`,
    subtitle: v.status,
    covenantId: isOnChainCovenantId(v.covenantId) ? v.covenantId : undefined,
    rows: [
      row('Status', v.status),
      row('Amount', sompiToKasLabel(v.amountSompi)),
      addressRow('Creator', v.creator),
      addressRow('Claimed by', v.claimedBy ?? undefined),
      row('Expires', formatTs(v.expiresAt)),
      row('Memo', v.memo?.trim() || undefined),
      covenantIdRow(v.covenantId),
      txRow('Lock tx', v.lockTxHash ?? v.utxo?.txId),
      txRow('Claim tx', v.claimTxHash),
    ].filter((r) => r.value || r.links?.length),
  }));
}
