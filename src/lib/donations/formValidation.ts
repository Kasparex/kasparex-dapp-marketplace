import { htmlToPlainText } from '@/lib/richText/html';
import {
  CROWDKAS_CONTENT_LIMITS,
  validateCrowdKasDescription,
  validateCrowdKasTitle,
} from '@/lib/donations/limits';
import type { CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';
import { resolveCrowdKasPremiumPayoutSplits } from '@/lib/donations/premiumSection';
import { validatePayoutSplitRows } from '@/lib/vblog/paymentSplit';

export type CrowdKasFormValidation = {
  ok: boolean;
  error?: string;
  requirements: string[];
  focusId?: string;
};

function fail(
  requirements: string[],
  error: string,
  focusId?: string,
): CrowdKasFormValidation {
  return { ok: false, requirements, error, focusId };
}

function ok(): CrowdKasFormValidation {
  return { ok: true, requirements: [] };
}

function validatePremiumSectionModules(
  modules: CrowdKasModulesConfig | undefined,
  fallbackAuthor: string,
): string | null {
  if (!modules?.premiumSectionEnabled) return null;
  if (!htmlToPlainText(modules.premiumSectionContent ?? '').trim()) {
    return 'Premium section needs content.';
  }
  const price = Number(modules.premiumSectionPriceKas);
  if (!Number.isFinite(price) || price <= 0) {
    return 'Premium section unlock price must be greater than 0 KAS.';
  }
  const splits = resolveCrowdKasPremiumPayoutSplits(modules, fallbackAuthor);
  return validatePayoutSplitRows(
    splits.map((s) => ({ address: s.address, sharePercent: s.sharePercent })),
  );
}

export function validateL1CovenantCreateForm(args: {
  title: string;
  shortDescription: string;
  mainContent: string;
  goalKas: string;
  deadline: string;
  minGoalKas: number;
  kaspaConnected: boolean;
  modules?: CrowdKasModulesConfig;
  creatorKaspaAddress?: string | null;
}): CrowdKasFormValidation {
  const requirements: string[] = [];

  if (!args.kaspaConnected) {
    requirements.push('Connect your Kaspa L1 wallet');
  }
  if (!args.title.trim()) {
    requirements.push('Campaign title');
  } else {
    const titleValidation = validateCrowdKasTitle(args.title, false);
    if (!titleValidation.valid) {
      return fail(requirements.length ? requirements : ['Campaign title'], titleValidation.error ?? 'Invalid title', 'ck-crowdfund-title');
    }
  }
  if (!args.shortDescription.trim()) {
    requirements.push('Short description');
  } else {
    const descValidation = validateCrowdKasDescription(args.shortDescription, false);
    if (!descValidation.valid) {
      return fail(
        requirements.length ? requirements : ['Short description'],
        descValidation.error ?? 'Invalid short description',
        'ck-crowdfund-short-description',
      );
    }
  }
  if (!htmlToPlainText(args.mainContent).trim()) {
    requirements.push('Main content');
  }
  const goal = parseFloat(args.goalKas);
  if (!Number.isFinite(goal) || goal < args.minGoalKas) {
    requirements.push(`Funding goal (min ${args.minGoalKas} KAS)`);
  }
  if (!args.deadline.trim()) {
    requirements.push('Deadline');
  } else {
    const end = new Date(args.deadline);
    if (isNaN(end.getTime()) || end.getTime() <= Date.now()) {
      requirements.push('Deadline must be in the future');
    }
  }

  const premiumErr = validatePremiumSectionModules(args.modules, args.creatorKaspaAddress ?? '');
  if (premiumErr) {
    requirements.push('Premium section setup');
    return fail(requirements, premiumErr, 'crowdkas-dashboard-modules');
  }

  if (requirements.length) {
    return fail(requirements, 'Complete required fields before paying.', requirements[0] === 'Campaign title' ? 'ck-crowdfund-title' : undefined);
  }
  return ok();
}

export function validateL2CampaignCreateForm(args: {
  title: string;
  shortDescription: string;
  mainContent: string;
  targetKas: string;
  endDate: string;
  imageUrl?: string;
  imageCid?: string | null;
  evmConnected: boolean;
  evmOnIgra: boolean;
  escrowConfigured: boolean;
  verified: boolean;
  modules?: CrowdKasModulesConfig;
  creatorKaspaAddress?: string | null;
}): CrowdKasFormValidation {
  const requirements: string[] = [];

  if (!args.evmConnected) {
    requirements.push('Connect your Igra (EVM) wallet');
  }
  if (!args.evmOnIgra) {
    requirements.push('Switch wallet to Igra Mainnet');
  }
  if (!args.escrowConfigured) {
    requirements.push('DonationEscrowV2 contract must be configured');
  }
  if (!args.verified) {
    requirements.push('Verify your wallet (1 wei)');
  }
  if (!args.title.trim()) {
    requirements.push('Campaign title');
  } else {
    const titleValidation = validateCrowdKasTitle(args.title, false);
    if (!titleValidation.valid) {
      return fail(requirements.length ? requirements : ['Campaign title'], titleValidation.error ?? 'Invalid title', 'crowdkas-l2-title');
    }
  }
  if (!args.shortDescription.trim()) {
    requirements.push('Short description');
  } else {
    const descValidation = validateCrowdKasDescription(args.shortDescription, false);
    if (!descValidation.valid) {
      return fail(
        requirements.length ? requirements : ['Short description'],
        descValidation.error ?? 'Invalid short description',
        'crowdkas-l2-short-description',
      );
    }
  }
  if (!htmlToPlainText(args.mainContent).trim()) {
    requirements.push('Main content');
  }
  if (!args.imageUrl?.trim() && !args.imageCid?.trim()) {
    requirements.push('Featured image (URL or IPFS upload)');
  }
  const target = parseFloat(args.targetKas);
  if (!Number.isFinite(target) || target < 100) {
    requirements.push('Target at least 100 iKAS');
  }
  if (!args.endDate.trim()) {
    requirements.push('End date');
  } else {
    const end = new Date(args.endDate);
    if (isNaN(end.getTime()) || end.getTime() <= Date.now()) {
      requirements.push('End date must be in the future');
    }
  }

  const premiumErr = validatePremiumSectionModules(args.modules, args.creatorKaspaAddress ?? '');
  if (premiumErr) {
    requirements.push('Premium section setup');
    return fail(requirements, premiumErr, 'crowdkas-dashboard-modules');
  }

  if (requirements.length) {
    return fail(requirements, 'Complete required fields before paying.', 'crowdkas-l2-title');
  }
  return ok();
}

export function validateL2CampaignEditForm(args: {
  title: string;
  shortDescription: string;
  mainContent: string;
  imageUrl?: string;
  imageCid?: string | null;
  evmConnected: boolean;
  evmOnIgra: boolean;
  escrowConfigured: boolean;
  modules?: CrowdKasModulesConfig;
  creatorKaspaAddress?: string | null;
}): CrowdKasFormValidation {
  const requirements: string[] = [];

  if (!args.evmConnected) requirements.push('Connect your Igra (EVM) wallet');
  if (!args.evmOnIgra) requirements.push('Switch wallet to Igra Mainnet');
  if (!args.escrowConfigured) requirements.push('DonationEscrowV2 contract must be configured');
  if (!args.title.trim()) requirements.push('Campaign title');
  if (!args.shortDescription.trim()) requirements.push('Short description');
  if (!htmlToPlainText(args.mainContent).trim()) requirements.push('Main content');
  if (!args.imageUrl?.trim() && !args.imageCid?.trim()) requirements.push('Featured image');

  const premiumErr = validatePremiumSectionModules(args.modules, args.creatorKaspaAddress ?? '');
  if (premiumErr) {
    requirements.push('Premium section setup');
    return fail(requirements, premiumErr, 'crowdkas-dashboard-modules');
  }

  if (requirements.length) {
    return fail(requirements, 'Complete required fields before saving.', 'crowdkas-edit-campaign');
  }
  return ok();
}

export function scrollToCrowdKasField(id?: string) {
  if (!id || typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

export { CROWDKAS_CONTENT_LIMITS };
