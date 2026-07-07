'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { DApp } from '@/lib/dapps';
import type { DAppTabDef } from './modules/types';
import { DAppWidgetLoading } from '@/components/dapps/DAppWidgetLoading';

const widgetLoading = { ssr: false, loading: () => <DAppWidgetLoading /> } as const;

const SimplePaymentWidget = dynamic(
  () => import('@/components/dapps/SimplePaymentWidget').then((m) => m.SimplePaymentWidget),
  widgetLoading,
);
const DAOVotingWidget = dynamic(
  () => import('@/components/dapps/DAOVotingWidget').then((m) => m.DAOVotingWidget),
  widgetLoading,
);
const GenesisBadgeWidget = dynamic(
  () => import('@/components/dapps/GenesisBadgeWidget').then((m) => m.GenesisBadgeWidget),
  widgetLoading,
);
const GenesisDappWidget = dynamic(
  () => import('@/components/dapps/GenesisDappWidget').then((m) => m.GenesisDappWidget),
  widgetLoading,
);
const CovenantLockboxWidget = dynamic(
  () => import('@/components/dapps/CovenantLockboxWidget').then((m) => m.CovenantLockboxWidget),
  widgetLoading,
);
const CovenantSplitWidget = dynamic(
  () => import('@/components/dapps/CovenantSplitWidget').then((m) => m.CovenantSplitWidget),
  widgetLoading,
);
const CovenantMilestoneWidget = dynamic(
  () => import('@/components/dapps/CovenantMilestoneWidget').then((m) => m.CovenantMilestoneWidget),
  widgetLoading,
);
const CovenantCrowdfundWidget = dynamic(
  () => import('@/components/dapps/CovenantCrowdfundWidget').then((m) => m.CovenantCrowdfundWidget),
  widgetLoading,
);
const CovenantVoucherWidget = dynamic(
  () => import('@/components/dapps/CovenantVoucherWidget').then((m) => m.CovenantVoucherWidget),
  widgetLoading,
);
const SendKREXWidget = dynamic(
  () => import('@/components/dapps/SendKREXWidget').then((m) => m.SendKREXWidget),
  widgetLoading,
);
const SendKASWidget = dynamic(
  () => import('@/components/dapps/SendKASWidget').then((m) => m.SendKASWidget),
  widgetLoading,
);

export type WidgetEntry = {
  slug?: string;
  id?: string;
  component: ComponentType<{ dapp?: DApp }>;
  extraTabs?: DAppTabDef[];
};

const WIDGET_REGISTRY: WidgetEntry[] = [
  { slug: 'simple-payment', id: '11', component: SimplePaymentWidget },
  { slug: 'dao-voting', component: DAOVotingWidget },
  { slug: 'genesis-badge', component: GenesisBadgeWidget },
  { slug: 'genesis-dapp', component: GenesisDappWidget },
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
