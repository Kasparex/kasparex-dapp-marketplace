'use client';

import type { ComponentType } from 'react';
import type { DApp } from '@/lib/dapps';
import type { DAppTabDef } from './modules/types';
import { SimplePaymentWidget } from '@/components/dapps/SimplePaymentWidget';
import { DAOVotingWidget } from '@/components/dapps/DAOVotingWidget';
import { GenesisDappWidget } from '@/components/dapps/GenesisDappWidget';
import { CovenantLockboxWidget } from '@/components/dapps/CovenantLockboxWidget';
import { CovenantSplitWidget } from '@/components/dapps/CovenantSplitWidget';
import { CovenantMilestoneWidget } from '@/components/dapps/CovenantMilestoneWidget';
import { CovenantCrowdfundWidget } from '@/components/dapps/CovenantCrowdfundWidget';
import { CovenantVoucherWidget } from '@/components/dapps/CovenantVoucherWidget';
import { SendKREXWidget } from '@/components/dapps/SendKREXWidget';
import { SendKASWidget } from '@/components/dapps/SendKASWidget';

export type WidgetEntry = {
  slug?: string;
  id?: string;
  component: ComponentType<{ dapp?: DApp }>;
  extraTabs?: DAppTabDef[];
};

const WIDGET_REGISTRY: WidgetEntry[] = [
  { slug: 'simple-payment', id: '11', component: SimplePaymentWidget },
  { slug: 'dao-voting', component: DAOVotingWidget },
  { slug: 'kaspa-capsule', component: GenesisDappWidget },
  { slug: 'lockbox', component: CovenantLockboxWidget },
  { slug: 'covenant-split', component: CovenantSplitWidget },
  { slug: 'covenant-milestone', component: CovenantMilestoneWidget },
  { slug: 'covenant-crowdfund', component: CovenantCrowdfundWidget },
  { slug: 'covenant-voucher', component: CovenantVoucherWidget },
  { slug: 'send-krex', id: '16', component: SendKREXWidget },
  { slug: 'send-kas', id: '15', component: SendKASWidget },
];

export function resolveWidgetEntry(dapp: DApp): WidgetEntry | null {
  return WIDGET_REGISTRY.find((e) => e.slug === dapp.slug || e.id === dapp.id) ?? null;
}

export { WIDGET_REGISTRY };
