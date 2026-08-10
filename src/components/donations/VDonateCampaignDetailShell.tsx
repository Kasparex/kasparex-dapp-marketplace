'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { AuthorInline } from '@/components/ui/AuthorInline';
import {
  VDonateCampaignMedia,
  VDonateNetworkBadges,
  VDonateStatusBadges,
} from '@/components/donations/VDonateCampaignCardChrome';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import type { CrowdfundFaqItem, CrowdfundTier, CrowdfundUpdate } from '@/lib/covenant/crowdfund-types';
import { sortTiersByMinKas } from '@/lib/donations/tiers';

export type VDonateDetailTab =
  | 'campaign'
  | 'rewards'
  | 'creator'
  | 'faq'
  | 'updates'
  | 'comments'
  | 'premium';

export type VDonateDetailCampaignView = {
  title: string;
  creatorAddress: string;
  imageUrl?: string | null;
  imageHash?: string | null;
  shortDescription?: string | null;
  mainContentHtml?: string | null;
  isLive: boolean;
  goalReached?: boolean;
  network: 'l1' | 'l2';
  featured?: boolean;
  raisedLabel: string;
  goalLabel: string;
  backersLabel: string;
  endsLabel: string;
  progressPct: number;
  tiers?: CrowdfundTier[];
  faq?: CrowdfundFaqItem[];
  updates?: CrowdfundUpdate[];
  socialLinks?: Record<string, string | undefined>;
  premiumTabEnabled?: boolean;
  premiumTabTitle?: string;
  premiumTabContent?: string;
  /** Optional L2 premium unlock module (existing CrowdKas modules). */
  premiumModule?: ReactNode;
  /** Extra blocks under the Campaign tab (modules, goals, etc.). */
  campaignExtras?: ReactNode;
  otherCampaigns?: { href: string; title: string }[];
  commentsSlot?: ReactNode;
};

const TAB_ICONS: Record<VDonateDetailTab, ReactNode> = {
  campaign: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  ),
  rewards: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
      />
    </svg>
  ),
  creator: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  faq: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  updates: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"
      />
    </svg>
  ),
  comments: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  premium: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  ),
};

export function VDonateCampaignDetailShell({
  view,
  rightColumn,
  initialTab,
  onSelectTier,
}: {
  view: VDonateDetailCampaignView;
  rightColumn: ReactNode;
  initialTab?: VDonateDetailTab;
  onSelectTier?: (tierId: string) => void;
}) {
  const [tab, setTab] = useState<VDonateDetailTab>(initialTab ?? 'campaign');

  const tabs = useMemo(() => {
    const list: DAppTab<VDonateDetailTab>[] = [
      { id: 'campaign', label: 'Campaign', icon: TAB_ICONS.campaign },
      { id: 'rewards', label: 'Rewards', icon: TAB_ICONS.rewards },
      { id: 'creator', label: 'Creator', icon: TAB_ICONS.creator },
      { id: 'faq', label: 'FAQ', icon: TAB_ICONS.faq },
      { id: 'updates', label: 'Updates', icon: TAB_ICONS.updates },
      { id: 'comments', label: 'Comments', icon: TAB_ICONS.comments },
    ];
    if (view.premiumTabEnabled || view.premiumModule) {
      list.push({
        id: 'premium',
        label: view.premiumTabTitle?.trim() || 'Premium',
        icon: TAB_ICONS.premium,
      });
    }
    return list;
  }, [view.premiumModule, view.premiumTabEnabled, view.premiumTabTitle]);

  const tiers = sortTiersByMinKas(view.tiers ?? []);
  const socialEntries = Object.entries(view.socialLinks ?? {}).filter(([, v]) => Boolean(v?.trim()));

  return (
    <div className={`min-h-screen flex flex-col ${HUB_PAGE_BG}`}>
      <Header />
      <div className="flex flex-1">
        <HubPageAccentLayout projectId="kasparex-donations">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar
              variant="minimal"
              backLink={{ href: '/donations', label: 'All campaigns' }}
            />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar
              variant="minimal"
              backLink={{ href: '/donations', label: 'All campaigns' }}
            />
          </div>
          <div className={HUB_MAIN_COLUMN}>
            <div className={HUB_MAIN_INNER}>
              <Link href="/donations" className="kx-body hover:underline mb-4 inline-block">
                ← All campaigns
              </Link>

              <div className="grid grid-cols-1 items-start lg:grid-cols-5 gap-6 lg:gap-10">
                <div className="lg:col-span-3 space-y-6 min-w-0">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                    <VDonateCampaignMedia imageUrl={view.imageUrl} imageHash={view.imageHash} />
                    <div className="p-6 md:p-8 space-y-4">
                      <div className="flex flex-col gap-2">
                        <VDonateStatusBadges isLive={view.isLive} goalReached={view.goalReached} />
                        <VDonateNetworkBadges network={view.network} featured={view.featured} />
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        {view.title}
                      </h1>
                      <AuthorInline
                        address={view.creatorAddress}
                        href={`/u/${encodeURIComponent(view.creatorAddress)}`}
                        prefix=""
                      />
                      {view.shortDescription ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {view.shortDescription}
                        </p>
                      ) : null}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider">Raised</p>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {view.raisedLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider">Target</p>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {view.goalLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider">Backers</p>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {view.backersLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider">Ends</p>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {view.endsLabel}
                          </p>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(view.progressPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <DAppTabs tabs={tabs} value={tab} onChange={setTab} />

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8">
                    {tab === 'campaign' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader title="Campaign" className="mb-0" />
                        {view.mainContentHtml ? (
                          <KxRichTextContent html={view.mainContentHtml} className="kx-prose" />
                        ) : view.shortDescription ? (
                          <p className="kx-body whitespace-pre-wrap">{view.shortDescription}</p>
                        ) : (
                          <p className="kx-body">No campaign story yet.</p>
                        )}
                        {view.campaignExtras}
                      </div>
                    ) : null}

                    {tab === 'rewards' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader title="Rewards" className="mb-0" />
                        {tiers.length === 0 ? (
                          <p className="kx-body">
                            This campaign has no reward tiers. You can still pledge any amount from the panel.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {tiers.map((tier) => {
                              const soldOut =
                                tier.limitedQty != null &&
                                tier.limitedQty > 0 &&
                                (tier.claimedCount ?? 0) >= tier.limitedQty;
                              return (
                                <div
                                  key={tier.id}
                                  className={`${KX_SURFACE_NESTED} rounded-xl p-4 space-y-2`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {tier.title}
                                      </p>
                                      <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                        {tier.minKas} KAS or more
                                      </p>
                                    </div>
                                    {onSelectTier && !soldOut ? (
                                      <button
                                        type="button"
                                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() => onSelectTier(tier.id)}
                                      >
                                        Select
                                      </button>
                                    ) : null}
                                    {soldOut ? (
                                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                        Sold out
                                      </span>
                                    ) : null}
                                  </div>
                                  {tier.description ? (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                      {tier.description}
                                    </p>
                                  ) : null}
                                  {tier.reward ? (
                                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                                      <span className="font-medium">Reward:</span> {tier.reward}
                                    </p>
                                  ) : null}
                                  {tier.limitedQty != null ? (
                                    <p className="text-xs text-zinc-500">
                                      {tier.claimedCount ?? 0} / {tier.limitedQty} claimed
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {tab === 'creator' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader title="Creator" className="mb-0" />
                        <AuthorInline
                          address={view.creatorAddress}
                          href={`/u/${encodeURIComponent(view.creatorAddress)}`}
                          prefix=""
                        />
                        <Link
                          href={`/u/${encodeURIComponent(view.creatorAddress)}`}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline inline-block"
                        >
                          View full profile
                        </Link>
                        {socialEntries.length > 0 ? (
                          <div className="flex flex-wrap gap-3 text-sm">
                            {socialEntries.map(([key, value]) => (
                              <a
                                key={key}
                                href={value!.startsWith('http') ? value! : `https://${value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 hover:underline capitalize"
                              >
                                {key}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="kx-body">No social links published for this campaign.</p>
                        )}
                        {view.otherCampaigns && view.otherCampaigns.length > 0 ? (
                          <div className="pt-2 space-y-2">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              More from this creator
                            </p>
                            <ul className="space-y-1">
                              {view.otherCampaigns.map((c) => (
                                <li key={c.href}>
                                  <Link
                                    href={c.href}
                                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                                  >
                                    {c.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {tab === 'faq' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader title="FAQ" className="mb-0" />
                        {(view.faq ?? []).length === 0 ? (
                          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                            <p>
                              <strong className="text-zinc-900 dark:text-zinc-100">
                                What happens if the goal is not met?
                              </strong>
                              <br />
                              Backers can refund after the deadline on L1 covenant campaigns. L2 escrow follows the
                              campaign contract refund rules.
                            </p>
                            <p>
                              <strong className="text-zinc-900 dark:text-zinc-100">
                                When does the creator receive funds?
                              </strong>
                              <br />
                              After a successful raise, the creator claims raised funds (goal met before deadline).
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {view.faq!.map((item) => (
                              <div key={item.id} className={`${KX_SURFACE_NESTED} rounded-xl p-4`}>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                                  {item.question}
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                                  {item.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {tab === 'updates' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader title="Updates" className="mb-0" />
                        {(view.updates ?? []).length === 0 ? (
                          <p className="kx-body">No updates yet. Check back after the creator posts progress.</p>
                        ) : (
                          <div className="space-y-3">
                            {[...(view.updates ?? [])]
                              .sort((a, b) => b.createdAt - a.createdAt)
                              .map((u) => (
                                <div key={u.id} className={`${KX_SURFACE_NESTED} rounded-xl p-4 space-y-1`}>
                                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{u.title}</p>
                                  <p className="text-xs text-zinc-500">
                                    {new Date(u.createdAt).toLocaleString()}
                                  </p>
                                  <KxRichTextContent html={u.body} className="kx-prose text-sm" />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {tab === 'comments' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader title="Comments" className="mb-0" />
                        {view.commentsSlot ?? (
                          <p className="kx-body">
                            Comments stay with your Hub wallet session. Connect and back this campaign to join the
                            conversation soon.
                          </p>
                        )}
                      </div>
                    ) : null}

                    {tab === 'premium' ? (
                      <div className="space-y-4">
                        <DAppSectionHeader
                          title={view.premiumTabTitle?.trim() || 'Premium'}
                          className="mb-0"
                        />
                        {view.premiumModule}
                        {view.premiumTabContent ? (
                          <KxRichTextContent html={view.premiumTabContent} className="kx-prose" />
                        ) : null}
                        {!view.premiumModule && !view.premiumTabContent ? (
                          <p className="kx-body">Premium content is not configured for this campaign.</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">{rightColumn}</div>
              </div>
            </div>
          </div>
        </HubPageAccentLayout>
      </div>
      <Footer />
    </div>
  );
}
