'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import {
  HubPageRightPanelGrid,
  HubPageRightPanelToggle,
} from '@/components/hub/HubPageRightPanel';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { AuthorInline } from '@/components/ui/AuthorInline';
import {
  VDonateCampaignMedia,
  VDonateNetworkBadgeGroup,
  VDonateStatusBadgeGroup,
} from '@/components/donations/VDonateCampaignCardChrome';
import { KX_PANEL, KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import type { CrowdfundFaqItem, CrowdfundTier, CrowdfundUpdate } from '@/lib/covenant/crowdfund-types';
import { sortTiersByMinKas } from '@/lib/donations/tiers';
import { useDonationsRightPanelOpen } from '@/hooks/useDonationsRightPanelOpen';
import { SidePanelCollapsedContentWrap } from '@/components/layout/SidePanelCollapsedContentWrap';
import { VDonateRewardTierList } from '@/components/donations/VDonateRewardTierList';
import { HubFaqAccordion } from '@/components/hub/HubFaqAccordion';

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
  premiumModule?: ReactNode;
  /** Backer unlocked the campaign premium tab (any active pledge / creator). */
  premiumUnlocked?: boolean;
  /** Tier ids whose reward content is unlocked for the viewer. */
  unlockedTierIds?: Set<string> | ReadonlySet<string>;
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
  onRewardPledge,
  rewardBusy,
}: {
  view: VDonateDetailCampaignView;
  rightColumn: ReactNode;
  initialTab?: VDonateDetailTab;
  /** @deprecated Prefer onRewardPledge (wires payment). */
  onSelectTier?: (tierId: string) => void;
  onRewardPledge?: (tier: CrowdfundTier) => void;
  rewardBusy?: boolean;
}) {
  const [tab, setTab] = useState<VDonateDetailTab>(initialTab ?? 'campaign');
  const [rightOpen, setRightOpen] = useDonationsRightPanelOpen(true);

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

  const handleRewardPledge = (tier: CrowdfundTier) => {
    onSelectTier?.(tier.id);
    setTab('rewards');
    if (onRewardPledge) {
      onRewardPledge(tier);
      return;
    }
    setRightOpen(true);
  };

  const campaignHero = (
    <div className={`${KX_PANEL} overflow-hidden`}>
      <VDonateCampaignMedia imageUrl={view.imageUrl} imageHash={view.imageHash} />
      <div className="p-6 md:p-8 space-y-4">
        <VDonateStatusBadgeGroup isLive={view.isLive} goalReached={view.goalReached} />
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          {view.title}
        </h1>
        <div className="flex items-center justify-between gap-3">
          <AuthorInline
            address={view.creatorAddress}
            href={`/u/${encodeURIComponent(view.creatorAddress)}`}
            prefix=""
          />
          <VDonateNetworkBadgeGroup network={view.network} featured={view.featured} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Raised</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{view.raisedLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Target</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{view.goalLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Backers</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{view.backersLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Ends</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{view.endsLabel}</p>
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
  );

  const tabBody = (
    <div className={`${KX_PANEL} p-6 md:p-8`}>
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
          <p className="kx-body">
            Pick a reward tier to unlock perks. Pledging runs the L1 covenant lock plus Hub platform fee.
            After you pledge a tier, its reward content unlocks here.
          </p>
          <VDonateRewardTierList
            tiers={tiers}
            onSelectAndPledge={handleRewardPledge}
            busy={rewardBusy}
            isLive={view.isLive}
            unlockedTierIds={view.unlockedTierIds}
          />
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
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">More from this creator</p>
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
            <HubFaqAccordion
              items={[
                {
                  id: 'default-goal',
                  question: 'What happens if the goal is not met?',
                  answer:
                    'Backers can refund after the deadline on L1 covenant campaigns. L2 escrow follows the campaign contract refund rules.',
                },
                {
                  id: 'default-claim',
                  question: 'When does the creator receive funds?',
                  answer:
                    'After a successful raise, the creator claims raised funds (goal met before deadline).',
                },
              ]}
            />
          ) : (
            <HubFaqAccordion
              items={(view.faq ?? []).map((item) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              }))}
            />
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
                  <div key={u.id} className={`${KX_SURFACE_NESTED} p-4 space-y-1`}>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{u.title}</p>
                    <p className="text-xs text-zinc-500">{new Date(u.createdAt).toLocaleString()}</p>
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
              Comments stay with your Hub wallet session. Connect and back this campaign to join the conversation soon.
            </p>
          )}
        </div>
      ) : null}

      {tab === 'premium' ? (
        <div className="space-y-4">
          <DAppSectionHeader title={view.premiumTabTitle?.trim() || 'Premium'} className="mb-0" />
          {view.premiumUnlocked !== false ? (
            <>
              {view.premiumModule}
              {view.premiumTabContent ? (
                <KxRichTextContent html={view.premiumTabContent} className="kx-prose" />
              ) : null}
              {!view.premiumModule && !view.premiumTabContent ? (
                <p className="kx-body">Premium content is not configured for this campaign.</p>
              ) : null}
            </>
          ) : (
            <div className={`${KX_SURFACE_NESTED} p-5 space-y-3`}>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Premium content locked
              </p>
              <p className="kx-body">
                Back this campaign (any reward tier or custom pledge) to unlock premium content for
                supporters.
              </p>
              {view.isLive ? (
                <button
                  type="button"
                  onClick={() => {
                    setTab('rewards');
                    setRightOpen(true);
                  }}
                  className="k-control-btn !bg-emerald-600 !text-white !border-emerald-600"
                >
                  View rewards and pledge
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

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
            <div className={`${HUB_MAIN_INNER} flex w-full min-w-0 flex-col gap-6`}>
              <Link href="/donations" className="kx-body hover:underline inline-block">
                ← All campaigns
              </Link>

              <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                <div className="min-w-0 flex-1">
                  <DAppTabs tabs={tabs} value={tab} onChange={setTab} />
                </div>
                <HubPageRightPanelToggle
                  panelId="kasparex-donations-campaign-panel"
                  rightOpen={rightOpen}
                  onToggle={() => setRightOpen(!rightOpen)}
                />
              </div>

              <HubPageRightPanelGrid
                panelId="kasparex-donations-campaign-panel"
                panelTitle="Campaign panel"
                rightOpen={rightOpen}
                onToggle={() => setRightOpen(!rightOpen)}
                sidebar={rightColumn}
                mainColClass="lg:col-span-7"
                asideColClass="lg:col-span-5"
                gridClassName="grid grid-cols-1 gap-8 xl:gap-12"
                hideToggle
              >
                <SidePanelCollapsedContentWrap panelOpen={rightOpen}>
                  <div className="flex min-w-0 flex-col gap-6">
                    {tab === 'campaign' ? campaignHero : null}
                    {tabBody}
                  </div>
                </SidePanelCollapsedContentWrap>
              </HubPageRightPanelGrid>
            </div>
          </div>
        </HubPageAccentLayout>
      </div>
      <Footer />
    </div>
  );
}
