import { computeArticleChunkPlan, deterministicStringify, VBLOG_PER_CHUNK_KAS, VBLOG_PER_KB_KAS } from '@/lib/vblog/pricing';
import {
  computeCrowdKasPayoutSplitAddonKas,
  cleanCrowdKasModulesConfig,
  defaultCrowdKasPayoutSplitRows,
  type CrowdKasModulesConfig,
} from '@/lib/donations/crowdkasModules';
import { CROWDKAS_PREMIUM_SECTION_ENABLE_FEE_KAS, CROWDKAS_PREMIUM_SECTION_OFFER } from '@/lib/donations/premiumSection';
import { getDonationModulePriceKas, DONATION_MODULE_OFFERS, type DonationPaidModuleId } from '@/lib/donations/modules';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';

export const VDONATE_VERIFY_FEE_KAS = 0;

/** Campaign create base fee (KAS on L1, iKAS on L2 platform fee). */
export const VDONATE_CREATE_BASE_FEE_KAS = 25;
export const VDONATE_EDIT_BASE_FEE_KAS = 5;
export const VDONATE_L2_CREATE_FEE_IKAS = VDONATE_CREATE_BASE_FEE_KAS;
export const VDONATE_L2_EDIT_FEE_IKAS = VDONATE_EDIT_BASE_FEE_KAS;

/** Delete is free only when the campaign has no donations. */
export const VDONATE_DELETE_FEE = 0;

export type CrowdKasAction = 'verify' | 'create' | 'edit' | 'delete';

export interface CrowdKasModuleAddonLine {
  id: string;
  label: string;
  kas: number;
}

export interface CrowdKasPricingDraft {
  title: string;
  description: string;
  mainContent?: string;
  category?: string;
  tags?: string[];
  goals?: string[];
  socialLinks?: Record<string, string | undefined>;
  imageUrl?: string;
  imageHash?: string;
  targetKas?: string;
  endDate?: string;
  l1Address?: string;
  modules?: CrowdKasModulesConfig;
  /** Module IDs already paid (excluded from edit module pricing). */
  excludePaidModuleIds?: DonationPaidModuleId[];
  /** Prior on-chain payload size (edit charges only for growth above this). */
  priorPricingSnapshot?: { payloadBytes: number; chunkCount: number };
}

export interface CrowdKasL1PriceQuote {
  action: CrowdKasAction;
  payloadBytes: number;
  chunkCount: number;
  baseFeeKas: number;
  sizeFeeKas: number;
  networkFeeBufferKas: number;
  payoutSplitAddonKas: number;
  modulesFeeKas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  subtotalKas: number;
  discountKas: number;
  krexDiscountPercent: number;
  totalKas: number;
}

export interface CrowdKasL2PriceQuote {
  action: CrowdKasAction;
  payloadBytes: number;
  chunkCount: number;
  baseFeeIkas: number;
  sizeFeeIkas: number;
  networkFeeBufferIkas: number;
  modulesFeeIkas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  subtotalIkas: number;
  discountIkas: number;
  krexDiscountPercent: number;
  totalIkas: number;
}

function round2(value: number): number {
  return Math.ceil(value * 100) / 100;
}

function normalizeModulesForPayload(modules?: CrowdKasModulesConfig): Record<string, unknown> | null {
  const cleaned = cleanCrowdKasModulesConfig(modules ?? {});
  return cleaned ? (cleaned as Record<string, unknown>) : null;
}

export function buildCanonicalCrowdKasPayload(draft: CrowdKasPricingDraft, action: CrowdKasAction): string {
  const canonical = {
    v: 1,
    action,
    title: draft.title.trim(),
    description: draft.description.trim(),
    mainContent: (draft.mainContent ?? '').trim(),
    category: (draft.category ?? '').trim(),
    tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean),
    goals: (draft.goals ?? []).map((g) => g.trim()).filter(Boolean),
    socialLinks: draft.socialLinks ?? {},
    imageUrl: (draft.imageUrl ?? '').trim(),
    imageHash: (draft.imageHash ?? '').trim(),
    targetKas: (draft.targetKas ?? '').trim(),
    endDate: (draft.endDate ?? '').trim(),
    l1Address: (draft.l1Address ?? '').trim(),
    modules: normalizeModulesForPayload(draft.modules),
  };
  return deterministicStringify(canonical);
}

function computeEditSizeFee(args: {
  payloadBytes: number;
  chunkCount: number;
  prior?: { payloadBytes: number; chunkCount: number };
}): { sizeFee: number; billableChunks: number } {
  const priorBytes = args.prior?.payloadBytes ?? 0;
  const priorChunks = args.prior?.chunkCount ?? 0;
  const billableBytes = Math.max(0, args.payloadBytes - priorBytes);
  const billableChunks = Math.max(0, args.chunkCount - priorChunks);
  const sizeFee = billableChunks * VBLOG_PER_CHUNK_KAS + (billableBytes / 1024) * VBLOG_PER_KB_KAS;
  return { sizeFee, billableChunks };
}

function getBaseFeeKas(action: CrowdKasAction): number {
  if (action === 'edit') return VDONATE_EDIT_BASE_FEE_KAS;
  if (action === 'create') return VDONATE_CREATE_BASE_FEE_KAS;
  return 0;
}

function getBaseFeeIkas(action: CrowdKasAction): number {
  if (action === 'edit') return VDONATE_L2_EDIT_FEE_IKAS;
  if (action === 'create') return VDONATE_L2_CREATE_FEE_IKAS;
  return 0;
}

function resolveL1ModuleLines(opts: {
  action: CrowdKasAction;
  modules?: CrowdKasModulesConfig;
}): CrowdKasModuleAddonLine[] {
  const { action, modules } = opts;
  if (action !== 'create' && action !== 'edit') return [];
  if (action === 'create' && modules?.premiumSectionEnabled) {
    return [
      {
        id: 'premiumSection',
        label: CROWDKAS_PREMIUM_SECTION_OFFER.title,
        kas: CROWDKAS_PREMIUM_SECTION_ENABLE_FEE_KAS,
      },
    ];
  }
  return [];
}

function resolveL2EscrowModuleLines(opts: {
  action: CrowdKasAction;
  modules?: CrowdKasModulesConfig;
  excludePaidModuleIds?: DonationPaidModuleId[];
  krexBalance: number;
  krexTier: KREXTier;
  nft: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasModuleAddonLine[] {
  const { action, modules, excludePaidModuleIds = [], krexBalance, krexTier, nft } = opts;
  if (action !== 'create' && action !== 'edit') return [];

  const pending = modules?.pendingPaidModules ?? [];
  const ids =
    action === 'edit'
      ? pending.filter((id) => !excludePaidModuleIds.includes(id))
      : pending;

  const lines: CrowdKasModuleAddonLine[] = ids.map((id) => {
    const offer = DONATION_MODULE_OFFERS[id];
    const ikas = getDonationModulePriceKas(offer.basePriceKas, krexBalance, krexTier, nft);
    return { id, label: offer.title, kas: ikas };
  });

  if (modules?.premiumSectionEnabled) {
    lines.push({
      id: 'premiumSection',
      label: CROWDKAS_PREMIUM_SECTION_OFFER.title,
      kas: CROWDKAS_PREMIUM_SECTION_ENABLE_FEE_KAS,
    });
  }

  return lines;
}

function resolvePayoutSplitAddonKas(modules?: CrowdKasModulesConfig): number {
  if (!modules?.payoutSplitEnabled) return 0;
  const count = modules.payoutSplitRecipients?.length ?? defaultCrowdKasPayoutSplitRows().length;
  return computeCrowdKasPayoutSplitAddonKas(count, true);
}

export function computeCrowdKasL1PriceQuote(opts: {
  action: CrowdKasAction;
  draft?: CrowdKasPricingDraft;
  enabledPaidModules?: DonationPaidModuleId[];
  payoutSplitRecipientCount?: number;
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasL1PriceQuote {
  const {
    action,
    draft,
    enabledPaidModules = [],
    payoutSplitRecipientCount = 0,
    krexBalance = 0,
    krexTier = 'Tier0',
    nft,
  } = opts;

  const discountPercent = KREX_TIERS[krexTier].feeDiscountPercent;
  const discount = Math.min(Math.max(discountPercent, 0), 90) / 100;

  const payload = draft ? buildCanonicalCrowdKasPayload(draft, action === 'edit' ? 'edit' : 'create') : '';
  const { payloadBytes, chunkCount } = draft
    ? computeArticleChunkPlan(payload)
    : { payloadBytes: 0, chunkCount: 1 };

  const baseFeeKas = getBaseFeeKas(action);
  const sizeBreakdown =
    action === 'edit' && draft
      ? computeEditSizeFee({
          payloadBytes,
          chunkCount,
          prior: draft.priorPricingSnapshot,
        })
      : {
          sizeFee: chunkCount * VBLOG_PER_CHUNK_KAS + (payloadBytes / 1024) * VBLOG_PER_KB_KAS,
          billableChunks: chunkCount,
        };
  const sizeFeeKas = sizeBreakdown.sizeFee;

  let payoutSplitAddonKas = 0;
  if (action === 'create') {
    if (draft?.modules?.payoutSplitEnabled) {
      payoutSplitAddonKas = resolvePayoutSplitAddonKas(draft.modules);
    } else if (payoutSplitRecipientCount > 0) {
      payoutSplitAddonKas = computeCrowdKasPayoutSplitAddonKas(payoutSplitRecipientCount, true);
    }
  }

  const moduleLines = draft
    ? resolveL1ModuleLines({ action, modules: draft.modules })
    : [];

  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);
  const networkFeeBufferKas =
    action === 'edit'
      ? sizeFeeKas > 0 || modulesFeeKas > 0
        ? Math.max(0.05, Math.max(sizeBreakdown.billableChunks, 1) * 0.01)
        : 0
      : action === 'create'
        ? Math.max(0.05, chunkCount * 0.01)
        : 0;

  const subtotalKas = baseFeeKas + sizeFeeKas + networkFeeBufferKas + payoutSplitAddonKas + modulesFeeKas;
  const totalKas = round2(subtotalKas * (1 - discount));
  const discountKas = round2(subtotalKas - totalKas);

  return {
    action,
    payloadBytes,
    chunkCount,
    baseFeeKas: round2(baseFeeKas),
    sizeFeeKas: round2(sizeFeeKas),
    networkFeeBufferKas: round2(networkFeeBufferKas),
    payoutSplitAddonKas: round2(payoutSplitAddonKas),
    modulesFeeKas: round2(modulesFeeKas),
    moduleLines,
    subtotalKas: round2(subtotalKas),
    discountKas,
    krexDiscountPercent: discountPercent,
    totalKas,
  };
}

export function computeCrowdKasL2PriceQuote(opts: {
  action: CrowdKasAction;
  draft?: CrowdKasPricingDraft;
  pendingPaidModules?: DonationPaidModuleId[];
  alreadyUnlocked?: Partial<Record<DonationPaidModuleId, boolean>>;
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasL2PriceQuote {
  const {
    action,
    draft,
    pendingPaidModules = [],
    alreadyUnlocked = {},
    krexBalance = 0,
    krexTier = 'Tier0',
    nft,
  } = opts;

  const discountPercent = KREX_TIERS[krexTier].feeDiscountPercent;
  const discount = Math.min(Math.max(discountPercent, 0), 90) / 100;

  const mergedDraft: CrowdKasPricingDraft | undefined = draft
    ? {
        ...draft,
        modules: {
          ...draft.modules,
          pendingPaidModules:
            draft.modules?.pendingPaidModules ??
            (pendingPaidModules.length ? pendingPaidModules : undefined),
        },
        excludePaidModuleIds: (Object.keys(alreadyUnlocked) as DonationPaidModuleId[]).filter(
          (id) => alreadyUnlocked[id],
        ),
      }
    : pendingPaidModules.length
      ? { title: '', description: '', modules: { pendingPaidModules } }
      : undefined;

  const payload = mergedDraft
    ? buildCanonicalCrowdKasPayload(mergedDraft, action === 'edit' ? 'edit' : 'create')
    : '';
  const { payloadBytes, chunkCount } = mergedDraft
    ? computeArticleChunkPlan(payload)
    : { payloadBytes: 0, chunkCount: 1 };

  const baseFeeIkas = getBaseFeeIkas(action);
  const sizeBreakdown =
    action === 'edit' && mergedDraft
      ? computeEditSizeFee({
          payloadBytes,
          chunkCount,
          prior: mergedDraft.priorPricingSnapshot,
        })
      : {
          sizeFee: chunkCount * VBLOG_PER_CHUNK_KAS + (payloadBytes / 1024) * VBLOG_PER_KB_KAS,
          billableChunks: chunkCount,
        };
  const sizeFeeIkas = sizeBreakdown.sizeFee;

  const l2ModuleLines = mergedDraft
    ? resolveL2EscrowModuleLines({
        action,
        modules: mergedDraft.modules,
        excludePaidModuleIds: mergedDraft.excludePaidModuleIds,
        krexBalance,
        krexTier,
        nft: nft ?? { hasAny: false, hasDiamond: false, hasRarest: false },
      })
    : [];

  const modulesFeeIkas = l2ModuleLines.reduce((sum, line) => sum + line.kas, 0);
  const networkFeeBufferIkas =
    action === 'edit'
      ? sizeFeeIkas > 0
        ? Math.max(0.05, Math.max(sizeBreakdown.billableChunks, 1) * 0.01)
        : 0
      : action === 'create'
        ? Math.max(0.05, chunkCount * 0.01)
        : 0;

  const platformSubtotalIkas = baseFeeIkas + sizeFeeIkas + networkFeeBufferIkas;
  const subtotalIkas = round2(platformSubtotalIkas + modulesFeeIkas);
  const totalIkas = round2(subtotalIkas * (1 - discount));
  const discountIkas = round2(subtotalIkas - totalIkas);

  return {
    action,
    payloadBytes,
    chunkCount,
    baseFeeIkas: round2(baseFeeIkas),
    sizeFeeIkas: round2(sizeFeeIkas),
    networkFeeBufferIkas: round2(networkFeeBufferIkas),
    modulesFeeIkas: round2(modulesFeeIkas),
    moduleLines: l2ModuleLines,
    subtotalIkas,
    discountIkas,
    krexDiscountPercent: discountPercent,
    totalIkas,
  };
}

/** @deprecated Use computeCrowdKasL1PriceQuote. */
export interface CrowdKasPriceQuote {
  action: CrowdKasAction;
  baseFeeKas: number;
  modulesFeeKas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  networkFeeBufferKas: number;
  totalKas: number;
}

/** @deprecated Use computeCrowdKasL1PriceQuote. */
export function computeCrowdKasPriceQuote(opts: {
  action: CrowdKasAction;
  enabledPaidModules?: DonationPaidModuleId[];
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasPriceQuote {
  const l1 = computeCrowdKasL1PriceQuote(opts);
  return {
    action: l1.action,
    baseFeeKas: l1.baseFeeKas,
    modulesFeeKas: l1.modulesFeeKas,
    moduleLines: l1.moduleLines,
    networkFeeBufferKas: l1.networkFeeBufferKas,
    totalKas: l1.totalKas,
  };
}
