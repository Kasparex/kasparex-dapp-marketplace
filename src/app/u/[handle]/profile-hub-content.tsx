'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { Avatar } from '@/components/Avatar';
import { formatKaspaAddress, isValidKaspaAddress, normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { createKnsClient, type KnsDomainProfileResponse, type KnsAsset } from '@/lib/kns/client';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { buildLinkEvmMessage, verifyLinkEvmSignature } from '@/lib/profile/linking';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
// heavy editors are opened as dedicated routes; keep Profile Hub lightweight

type TabId =
  | 'overview'
  | 'workspace'
  | 'creator-content'
  | 'creator-create'
  | 'ads'
  | 'assets'
  | 'kns'
  | 'settings';

const StudioDashboardPage = dynamic(() => import('@/app/studio/dashboard/page').then((m) => m.default), {
  ssr: false,
  loading: () => <LoadingCard label="Loading dashboard…" />,
});
const StudioPortfolioPage = dynamic(() => import('@/app/studio/portfolio/page').then((m) => m.default), {
  ssr: false,
  loading: () => <LoadingCard label="Loading portfolio…" />,
});
const StudioActivityPage = dynamic(() => import('@/app/studio/activity/page').then((m) => m.default), {
  ssr: false,
  loading: () => <LoadingCard label="Loading activity…" />,
});
const StudioVBlogPage = dynamic(() => import('@/app/studio/vblog/page').then((m) => m.default), {
  ssr: false,
  loading: () => <LoadingCard label="Loading article editor…" />,
});
const StudioMagazinePage = dynamic(() => import('@/app/studio/magazine/page').then((m) => m.default), {
  ssr: false,
  loading: () => <LoadingCard label="Loading magazine editor…" />,
});
const StudioStorePage = dynamic(() => import('@/app/studio/store/page').then((m) => m.default), {
  ssr: false,
  loading: () => <LoadingCard label="Loading store editor…" />,
});

export function ProfileHubContent({
  initialHandle,
  initialKaspaAddress,
  initialKnsName,
}: {
  initialHandle: string;
  initialKaspaAddress: string | null;
  initialKnsName: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: connectedEvmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync, isPending: isSigningEvm } = useSignMessage();
  const { state: kaspaState } = useKaspaWallet();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const view = (searchParams?.get('view') || '').toLowerCase();
  const [knsProfile, setKnsProfile] = useState<KnsDomainProfileResponse | null>(null);
  const [knsAssets, setKnsAssets] = useState<KnsAsset[] | null>(null);
  const [knsPrimaryName, setKnsPrimaryName] = useState<string | null>(initialKnsName);
  const [knsDomains, setKnsDomains] = useState<string[] | null>(null);

  const kaspaAddress = useMemo(() => {
    if (initialKaspaAddress) {
      try {
        return normalizeKaspaAddress(initialKaspaAddress).toLowerCase();
      } catch {
        const lower = initialKaspaAddress.toLowerCase();
        return lower.startsWith('kaspa:') ? lower : `kaspa:${lower}`;
      }
    }
    // If user lands on /u/<something> but is connected with Kaspa wallet and it matches the handle, allow it.
    if (initialHandle && isValidKaspaAddress(initialHandle)) {
      try {
        return normalizeKaspaAddress(initialHandle).toLowerCase();
      } catch {
        return initialHandle.toLowerCase();
      }
    }
    return null;
  }, [initialKaspaAddress, initialHandle]);

  const baseProfileHref = useMemo(() => {
    return kaspaAddress ? `/u/${encodeURIComponent(kaspaAddress)}` : '/u';
  }, [kaspaAddress]);

  const hrefTab = useMemo(() => {
    return (tab: string, nextView?: string) => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (nextView) params.set('view', nextView);
      return `${baseProfileHref}?${params.toString()}`;
    };
  }, [baseProfileHref]);

  const goTab = useMemo(() => {
    return (tab: TabId, nextView?: string) => {
      setActiveTab(tab);
      router.replace(hrefTab(tab, nextView));
    };
  }, [hrefTab, router]);

  const { profile, source, updateLocalProfile } = useUnifiedProfile(kaspaAddress);

  const isOwnProfile = useMemo(() => {
    if (!kaspaAddress) return false;
    const connected = (kaspaState.address || '').toLowerCase();
    return Boolean(kaspaState.isConnected && connected && connected === kaspaAddress.toLowerCase());
  }, [kaspaAddress, kaspaState.address, kaspaState.isConnected]);

  const displayName = useMemo(() => {
    return (
      profile?.displayName?.trim() ||
      knsPrimaryName ||
      (kaspaAddress ? formatKaspaAddress(kaspaAddress).display : initialHandle)
    );
  }, [profile?.displayName, knsPrimaryName, kaspaAddress, initialHandle]);

  const bannerUrl = profile?.bannerUrl?.trim() || knsProfile?.banner || null;
  const avatarUrl = profile?.avatarUrl?.trim() || knsProfile?.avatar || null;

  useEffect(() => {
    let cancelled = false;
    async function loadKns() {
      if (!kaspaAddress) return;
      const defaultNet = createKnsClient().network;
      const nets: Array<'mainnet' | 'tn10'> = [defaultNet, defaultNet === 'mainnet' ? 'tn10' : 'mainnet'];

      for (const net of nets) {
        const kns = createKnsClient({ network: net });
        const primary = await kns.getPrimaryNameByOwner(kaspaAddress);
        const name =
          ((primary as any)?.domain?.fullName as string | undefined) ||
          ((primary as any)?.domain?.full_name as string | undefined) ||
          ((primary as any)?.primaryName as string | undefined) ||
          ((primary as any)?.primary_name as string | undefined) ||
          ((primary as any)?.domain as string | undefined) ||
          null;
        if (!cancelled && name) setKnsPrimaryName(String(name).toLowerCase());
        const assetId = (primary?.inscriptionId || primary?.inscription_id) as string | undefined;
        if (assetId) {
          const p = await kns.getDomainProfileByAssetId(assetId);
          if (!cancelled) setKnsProfile(p);
          break;
        }
        if (name) break;
      }
    }
    loadKns();
    return () => {
      cancelled = true;
    };
  }, [kaspaAddress]);

  useEffect(() => {
    let cancelled = false;
    async function loadAssets() {
      if (!kaspaAddress) return;
      const defaultNet = createKnsClient().network;
      const nets: Array<'mainnet' | 'tn10'> = [defaultNet, defaultNet === 'mainnet' ? 'tn10' : 'mainnet'];
      let best: KnsAsset[] = [];
      for (const net of nets) {
        try {
          const kns = createKnsClient({ network: net });
          const assets = await kns.getAssetsByOwner(kaspaAddress);
          if (assets && assets.length > best.length) best = assets;
        } catch {
          // ignore
        }
      }
      if (!cancelled) {
        setKnsAssets(best);
        const domains = best
          .map((a) => String((a as any).asset || (a as any).domain || '').trim())
          .filter(Boolean)
          .map((d) => d.toLowerCase());
        const uniq = Array.from(new Set(domains)).sort();
        setKnsDomains(uniq);
      }
    }
    loadAssets();
    return () => {
      cancelled = true;
    };
  }, [kaspaAddress]);

  useEffect(() => {
    const tab = (searchParams?.get('tab') || '').toLowerCase();
    if (tab === 'editors') {
      const v = (searchParams?.get('view') || 'vblog').toLowerCase();
      setActiveTab('workspace');
      router.replace(hrefTab('workspace', v));
      return;
    }
    if (tab === 'dapps') {
      setActiveTab('creator-content');
      router.replace(hrefTab('creator-content'));
      return;
    }
    if (tab === 'content') {
      setActiveTab('creator-content');
      router.replace(hrefTab('creator-content'));
      return;
    }
    // Back-compat: old My-* tabs now map to unified creator content.
    if (tab === 'my-dapps' || tab === 'my-articles' || tab === 'my-products' || tab === 'my-magazines') {
      setActiveTab('creator-content');
      router.replace(hrefTab('creator-content'));
      return;
    }
    const allowed: TabId[] = [
      'overview',
      'workspace',
      'creator-content',
      'creator-create',
      'ads',
      'assets',
      'kns',
      'settings',
    ];
    if (allowed.includes(tab as TabId)) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams, router, hrefTab]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <UnifiedSidebar
            storageKeyPrefix="profile-hub"
            header={(onHide) => (
              <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} />
            )}
          >
            <div className="mb-6 space-y-2 px-2">
              {isOwnProfile ? (
                <button type="button" onClick={() => goTab('settings')} className="k-control-btn w-full justify-center">
                  Settings
                </button>
              ) : null}
              <Link href="/profile-modules" className="k-control-btn w-full justify-center">
                Modules
              </Link>
            </div>

            <SidebarSection title="Workspace">
              <nav className="space-y-0.5">
                <SidebarNavItem
                  label="Overview"
                  active={activeTab === 'overview'}
                  onClick={() => goTab('overview')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                />
                <SidebarNavItem
                  label="Creator hub"
                  active={activeTab === 'workspace' && (!view || view === 'hub' || view === 'home')}
                  onClick={() => goTab('workspace')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
                <SidebarNavItem
                  label="Dashboard"
                  active={activeTab === 'workspace' && view === 'dashboard'}
                  onClick={() => goTab('workspace', 'dashboard')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <SidebarNavItem
                  label="Portfolio"
                  active={activeTab === 'workspace' && view === 'portfolio'}
                  onClick={() => goTab('workspace', 'portfolio')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V20a2 2 0 002 2h14a2 2 0 002-2v-6.745zM18 8a2 2 0 11-4 0 2 2 0 014 0zM10 8a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M6 5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3H6V5z" /></svg>}
                />
                <SidebarNavItem
                  label="Activity"
                  active={activeTab === 'workspace' && view === 'activity'}
                  onClick={() => goTab('workspace', 'activity')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <SidebarNavItem
                  label="vBlog"
                  active={activeTab === 'workspace' && view === 'vblog'}
                  onClick={() => goTab('workspace', 'vblog')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
                <SidebarNavItem
                  label="Magazines"
                  active={activeTab === 'workspace' && view === 'magazine'}
                  onClick={() => goTab('workspace', 'magazine')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                <SidebarNavItem
                  label="Store"
                  active={activeTab === 'workspace' && view === 'store'}
                  onClick={() => goTab('workspace', 'store')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" /></svg>}
                />
              </nav>
            </SidebarSection>

            <SidebarSection title="Creator hub">
              <nav className="space-y-0.5">
                <SidebarNavItem
                  label="Content"
                  active={activeTab === 'creator-content'}
                  onClick={() => goTab('creator-content')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <SidebarNavItem
                  label="Create"
                  active={activeTab === 'creator-create'}
                  onClick={() => goTab('creator-create')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
              </nav>
            </SidebarSection>

            <SidebarSection title="Management">
              <nav className="space-y-0.5">
                <SidebarNavItem
                  label="Ads"
                  active={activeTab === 'ads'}
                  onClick={() => goTab('ads')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>}
                />
                <SidebarNavItem
                  label="Assets"
                  active={activeTab === 'assets'}
                  onClick={() => goTab('assets')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
              </nav>
            </SidebarSection>

            <SidebarSection title="Identity">
              <nav className="space-y-0.5">
                <SidebarNavItem
                  label="KNS"
                  active={activeTab === 'kns'}
                  onClick={() => goTab('kns')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
              </nav>
            </SidebarSection>

            <SidebarSection title="Tools">
              <nav className="space-y-0.5">
                <SidebarNavItem
                  label="dApp modules"
                  href="/dapp-modules"
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                />
                <SidebarNavItem
                  label="Revenue tree"
                  href="/tree/dashboard"
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
              </nav>
            </SidebarSection>
          </UnifiedSidebar>

          {/* Main content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ProfileHaloHeader
                  displayName={displayName}
                  kaspaAddress={kaspaAddress}
                  knsPrimaryName={knsPrimaryName}
                  knsDomains={knsDomains}
                  bio={profile?.bio?.trim() || knsProfile?.bio || ''}
                  source={source}
                  bannerUrl={bannerUrl}
                  avatarUrl={avatarUrl}
                  isOwnProfile={isOwnProfile}
                  onEdit={() => goTab('settings')}
                  onOpenKns={() => goTab('kns')}
                />

                <ProfileTabStrip
                  activeTab={activeTab}
                  isOwnProfile={isOwnProfile}
                  onTab={(t) => goTab(t)}
                />

                {activeTab === 'overview' && (
                  <OverviewTab
                    kaspaAddress={kaspaAddress}
                    knsProfile={knsProfile}
                    profileBio={profile?.bio || ''}
                    profileWebsite={profile?.website}
                    profileGithub={profile?.github}
                    profileX={profile?.x}
                    profileHref={kaspaAddress ? `/u/${encodeURIComponent(kaspaAddress)}` : '/u'}
                  />
                )}

                {activeTab === 'workspace' && <WorkspaceTab view={view} goTab={goTab} />}

                {activeTab === 'creator-content' && (
                  <CreatorContentTab
                    kaspaAddress={kaspaAddress}
                    isOwnProfile={isOwnProfile}
                    linkedEvmAddress={profile?.linkedEvmWallets?.[0]?.address || null}
                  />
                )}

                {activeTab === 'creator-create' && (
                  <CreatorCreateTab
                    kaspaAddress={kaspaAddress}
                    isOwnProfile={isOwnProfile}
                  />
                )}

                {activeTab === 'ads' && <ProfileAdsTab />}

                {activeTab === 'assets' && <AssetsTab />}

                {activeTab === 'kns' && (
                  <KnsTab
                    kaspaAddress={kaspaAddress}
                    primaryName={knsPrimaryName}
                    knsDomains={knsDomains}
                    assets={knsAssets}
                    isLoading={knsAssets === null}
                  />
                )}

                {activeTab === 'settings' && isOwnProfile && (
                  <SettingsTab
                    displayName={profile?.displayName || ''}
                    bio={profile?.bio || ''}
                    avatarUrl={profile?.avatarUrl || ''}
                    bannerUrl={profile?.bannerUrl || ''}
                    kaspaAddress={kaspaAddress}
                    connectedEvmAddress={isEvmConnected ? (connectedEvmAddress as `0x${string}`) : null}
                    isLinking={isSigningEvm}
                    onLinkEvm={async (evmAddress) => {
                      if (!kaspaAddress) return;
                      const nonce = crypto.randomUUID();
                      const issuedAtIso = new Date().toISOString();
                      const host = window.location.host;
                      const message = buildLinkEvmMessage({
                        kaspaAddress,
                        evmAddress,
                        nonce,
                        issuedAtIso,
                        host,
                      });
                      const signature = (await signMessageAsync({ message })) as `0x${string}`;
                      const valid = await verifyLinkEvmSignature({ message, evmAddress, signature });
                      if (!valid) {
                        throw new Error('Signature verification failed');
                      }
                      updateLocalProfile({
                        linkedEvmWallets: [
                          ...((profile?.linkedEvmWallets || []) as any[]),
                          { address: evmAddress, message, signature, linkedAt: Date.now() },
                        ],
                      });
                    }}
                    onSave={(updates) => updateLocalProfile(updates)}
                  />
                )}

                {!kaspaAddress && (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      <div>
                        This profile could not be resolved yet. Try opening a `.kas` name (example: <span className="font-semibold">yourname.kas</span>) or a Kaspa address.
                      </div>
                      <div className="mt-2">
                        If you opened an EVM address, link it to a Kaspa identity first.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function OverviewTab({
  kaspaAddress,
  knsProfile,
  profileBio,
  profileWebsite,
  profileGithub,
  profileX,
  profileHref,
}: {
  kaspaAddress: string | null;
  knsProfile: KnsDomainProfileResponse | null;
  profileBio: string;
  profileWebsite?: string;
  profileGithub?: string;
  profileX?: string;
  profileHref: string;
}) {
  const website = profileWebsite || knsProfile?.website;
  const github = profileGithub || knsProfile?.github;
  const x = profileX || knsProfile?.x || knsProfile?.twitter;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Bio">
          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {(profileBio || knsProfile?.bio || 'No bio yet.').trim()}
          </div>
        </Card>

        <Card title="Public links">
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoPill label="Website" value={website || '—'} />
            <InfoPill label="GitHub" value={github || '—'} />
            <InfoPill label="X" value={x || '—'} />
            <InfoPill label="Kaspa" value={kaspaAddress ? formatKaspaAddress(kaspaAddress).display : '—'} />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Public profile">
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Visibility</span>
              <span className="font-black text-zinc-900 dark:text-zinc-100">Public</span>
            </div>
            <div className="text-[11px] leading-relaxed">
              This page is designed to be shareable. Over time, profile updates will be anchored on IPFS and verifiable via wallet signatures.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SubpageToolbar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button type="button" onClick={onBack} className="k-control-btn">
        Back to creator hub
      </button>
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</span>
    </div>
  );
}

function EditorShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <SubpageToolbar title={title} onBack={onBack} />
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">{children}</div>
    </div>
  );
}

const WORKSPACE_HUB_ENTRIES: Array<{ key: string; title: string; description: string; view: string; accent: 'studio' | 'vblog' | 'magazines' | 'store' }> = [
  { key: 'dash', title: 'Dashboard', description: 'Metrics, quick actions, and recent activity.', view: 'dashboard', accent: 'studio' },
  { key: 'port', title: 'Portfolio', description: 'Your creator portfolio overview.', view: 'portfolio', accent: 'studio' },
  { key: 'act', title: 'Activity', description: 'Records and timeline.', view: 'activity', accent: 'studio' },
  { key: 'vb', title: 'vBlog', description: 'Write and publish articles.', view: 'vblog', accent: 'vblog' },
  { key: 'mag', title: 'Magazines', description: 'Lay out digital issues.', view: 'magazine', accent: 'magazines' },
  { key: 'st', title: 'Store', description: 'List products on Kasparex Store.', view: 'store', accent: 'store' },
];

function WorkspaceHub({ goTab }: { goTab: (tab: TabId, nextView?: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle title="Creator hub" />
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Choose dashboard, portfolio, activity, or an editor. Everything lives under one workspace tab.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WORKSPACE_HUB_ENTRIES.map((e) => (
          <button
            key={e.key}
            type="button"
            data-kx-accent={e.accent}
            onClick={() => goTab('workspace', e.view)}
            className="kx-listing-card group block w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{e.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkspaceTab({ view, goTab }: { view: string; goTab: (tab: TabId, nextView?: string) => void }) {
  const v = (view || '').toLowerCase();
  if (!v || v === 'hub' || v === 'home') {
    return <WorkspaceHub goTab={goTab} />;
  }
  if (v === 'dashboard') {
    return (
      <>
        <SubpageToolbar title="Dashboard" onBack={() => goTab('workspace')} />
        <StudioDashboardPage />
      </>
    );
  }
  if (v === 'portfolio') {
    return (
      <>
        <SubpageToolbar title="Portfolio" onBack={() => goTab('workspace')} />
        <StudioPortfolioPage />
      </>
    );
  }
  if (v === 'activity') {
    return (
      <>
        <SubpageToolbar title="Activity" onBack={() => goTab('workspace')} />
        <StudioActivityPage />
      </>
    );
  }
  if (v === 'vblog') {
    return (
      <EditorShell title="vBlog editor" onBack={() => goTab('workspace')}>
        <StudioVBlogPage />
      </EditorShell>
    );
  }
  if (v === 'magazine') {
    return (
      <EditorShell title="Magazine editor" onBack={() => goTab('workspace')}>
        <StudioMagazinePage />
      </EditorShell>
    );
  }
  if (v === 'store') {
    return (
      <EditorShell title="Store editor" onBack={() => goTab('workspace')}>
        <StudioStorePage />
      </EditorShell>
    );
  }
  return <WorkspaceHub goTab={goTab} />;
}

const MOCK_PROFILE_DAPPS = [
  { id: 'ph-d1', title: 'Kasparex Feed', slug: 'kasparex-feed', status: 'Live' },
  { id: 'ph-d2', title: 'CrowdKAS bridge', slug: 'crowdkas-bridge', status: 'Draft' },
  { id: 'ph-d3', title: 'NFT tools hub', slug: 'nft-tools-hub', status: 'Review' },
] as const;

const MOCK_PROFILE_ADS = [
  { id: 'pad-1', title: 'Sidebar spotlight', slot: 'SIDEBAR_RANDOM', status: 'Active', daysLeft: 12 },
  { id: 'pad-2', title: 'dApps hero takeover', slot: 'DAPPS_HERO', status: 'Paused', daysLeft: 0 },
  { id: 'pad-3', title: 'Cross-network bundle', slot: 'Bundle', status: 'Draft', daysLeft: 30 },
] as const;

function ProfileAdsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="My ads" />
        <div className="flex flex-wrap gap-2">
          <Link href="/ads?create=1" className="k-control-btn whitespace-nowrap">
            Create ad
          </Link>
          <Link href="/ads/overview" className="k-control-btn whitespace-nowrap">
            Pricing
          </Link>
          <Link href="/ads" className="k-control-btn whitespace-nowrap">
            Kasparex Ads
          </Link>
        </div>
      </div>
      <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Campaigns paid from your connected Kaspa (L1) wallet. Below is a layout preview; live checkout and registry data stay
        in Kasparex Ads.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_PROFILE_ADS.map((a) => (
          <KxListingCard key={a.id} href="/ads?create=1" accent="ads" className="flex flex-col overflow-hidden">
            <KxListingCardMedia aspectClass="aspect-[3/2]">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 to-pink-500/5 dark:from-pink-500/25" />
              <div className="absolute left-3 top-3 z-10">
                <span className="rounded-full border border-pink-500/25 bg-white/90 px-2 py-0.5 text-xs font-semibold text-pink-900 dark:bg-zinc-900/90 dark:text-pink-200">
                  {a.status}
                </span>
              </div>
            </KxListingCardMedia>
            <KxListingCardBody>
              <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{a.title}</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Slot: {a.slot}
                {a.daysLeft > 0 ? ` · ${a.daysLeft} days left` : ''}
              </div>
            </KxListingCardBody>
          </KxListingCard>
        ))}
      </div>
    </div>
  );
}

const MOCK_ARTICLES = [
  { id: 'a1', title: 'State of Kaspa 2026', status: 'Published', href: '/vblog' },
  { id: 'a2', title: 'Building on KREX', status: 'Draft', href: '/vblog' },
] as const;

const MOCK_PRODUCTS = [
  { id: 'p1', title: 'Kaspa UI Kit', price: '12 KAS', status: 'Active' },
  { id: 'p2', title: 'Creator template pack', price: '5 KAS', status: 'Draft' },
] as const;

const MOCK_MAGAZINES = [
  { id: 'm1', title: 'KREX Monthly #4', status: 'Draft' },
  { id: 'm2', title: 'Kaspa dev digest', status: 'Published' },
] as const;

type CreatorContentType = 'dapps' | 'articles' | 'products' | 'magazines' | 'ads' | 'crowdkas';
type CreatorContentStatus = 'published' | 'draft' | 'review' | 'paused';
type CreatorAvailability = 'live' | 'coming-soon' | 'demo';

type CreatorCardItem = {
  id: string;
  type: CreatorContentType;
  title: string;
  subtitle?: string;
  status: CreatorContentStatus;
  availability: CreatorAvailability;
  publicHref: string;
  editHref?: string;
  accent: 'dapps' | 'vblog' | 'store' | 'magazines' | 'ads' | 'crowdkas';
};

function toStatus(raw: string): CreatorContentStatus {
  const v = (raw || '').toLowerCase();
  if (v.includes('publish') || v === 'live' || v === 'active') return 'published';
  if (v.includes('pause')) return 'paused';
  if (v.includes('review')) return 'review';
  return 'draft';
}

function statusLabel(s: CreatorContentStatus): string {
  if (s === 'published') return 'Published';
  if (s === 'paused') return 'Paused';
  if (s === 'review') return 'Review';
  return 'Draft';
}

function availabilityLabel(a: CreatorAvailability): string | null {
  if (a === 'live') return null;
  if (a === 'demo') return 'Demo';
  return 'Coming soon';
}

function CreatorContentTab({
  kaspaAddress,
  isOwnProfile,
  linkedEvmAddress,
}: {
  kaspaAddress: string | null;
  isOwnProfile: boolean;
  linkedEvmAddress: string | null;
}) {
  const [typeFilter, setTypeFilter] = useState<CreatorContentType | 'all'>('all');

  const authorHref = useMemo(() => {
    return kaspaAddress ? `/vblog/author/${encodeURIComponent(kaspaAddress).replaceAll('%3A', ':')}` : '/vblog';
  }, [kaspaAddress]);

  const items: CreatorCardItem[] = useMemo(() => {
    const dapps: CreatorCardItem[] = MOCK_PROFILE_DAPPS.map((d) => ({
      id: d.id,
      type: 'dapps',
      title: d.title,
      subtitle: `/${d.slug}`,
      status: toStatus(d.status),
      availability: 'coming-soon',
      publicHref: `/dapps/${d.slug}`,
      editHref: undefined,
      accent: 'dapps',
    }));

    const articles: CreatorCardItem[] = MOCK_ARTICLES.map((a) => ({
      id: a.id,
      type: 'articles',
      title: a.title,
      subtitle: 'Kasparex vBlog',
      status: toStatus(a.status),
      availability: 'live',
      publicHref: authorHref,
      editHref: '/vblog/editor/new',
      accent: 'vblog',
    }));

    const products: CreatorCardItem[] = MOCK_PRODUCTS.map((p) => ({
      id: p.id,
      type: 'products',
      title: p.title,
      subtitle: p.price,
      status: toStatus(p.status),
      availability: 'coming-soon',
      publicHref: '/store',
      editHref: undefined,
      accent: 'store',
    }));

    const magazines: CreatorCardItem[] = MOCK_MAGAZINES.map((m) => ({
      id: m.id,
      type: 'magazines',
      title: m.title,
      subtitle: 'Kasparex Magazines',
      status: toStatus(m.status),
      availability: 'coming-soon',
      publicHref: '/magazines',
      editHref: undefined,
      accent: 'magazines',
    }));

    const ads: CreatorCardItem[] = MOCK_PROFILE_ADS.map((a) => ({
      id: a.id,
      type: 'ads',
      title: a.title,
      subtitle: `Slot: ${a.slot}${a.daysLeft > 0 ? ` · ${a.daysLeft} days left` : ''}`,
      status: toStatus(a.status),
      availability: 'coming-soon',
      publicHref: '/ads',
      editHref: undefined,
      accent: 'ads',
    }));

    const crowdkas: CreatorCardItem[] = [
      {
        id: 'crowdkas-campaigns',
        type: 'crowdkas',
        title: 'CrowdKAS campaigns',
        subtitle: linkedEvmAddress ? 'Public campaign page' : 'Link an EVM wallet to enable public campaigns page',
        status: linkedEvmAddress ? 'published' : 'draft',
        availability: linkedEvmAddress ? 'live' : 'coming-soon',
        publicHref: linkedEvmAddress ? `/donations/${linkedEvmAddress}` : '/donations',
        editHref: '/donations/studio',
        accent: 'crowdkas',
      },
    ];

    return [...dapps, ...articles, ...crowdkas, ...products, ...magazines, ...ads];
  }, [authorHref, linkedEvmAddress]);

  const filtered = useMemo(() => {
    const base = typeFilter === 'all' ? items : items.filter((i) => i.type === typeFilter);
    if (isOwnProfile) return base;
    // Public view: show published live items, plus non-live placeholders so users can see what's planned.
    return base.filter((i) => i.availability !== 'live' || i.status === 'published');
  }, [items, isOwnProfile, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Creator content" />
        <div className="flex flex-wrap gap-2">
          <Link href={authorHref} className="k-control-btn whitespace-nowrap">
            Public creator page
          </Link>
          {isOwnProfile ? (
            <Link href="/u?tab=creator-create" className="k-control-btn whitespace-nowrap">
              Create new
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'dapps', 'articles', 'crowdkas', 'products', 'magazines', 'ads'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`k-control-btn whitespace-nowrap ${typeFilter === t ? '!bg-[#02abb8] !text-white !border-[#02abb8]/30' : ''}`}
          >
            {t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400">
          {isOwnProfile ? 'No items yet. Use Create to publish your first content.' : 'No published items yet.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <div key={`${i.type}_${i.id}`} className="space-y-2">
              <KxListingCard href={i.publicHref} accent={i.accent} className="flex flex-col overflow-hidden">
                <KxListingCardMedia aspectClass="aspect-[3/2]">
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
                  <div className="absolute left-3 top-3 z-10">
                    <span className="rounded-full border border-zinc-200 bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200">
                      {statusLabel(i.status)}
                    </span>
                    {availabilityLabel(i.availability) ? (
                      <span className="ml-2 rounded-full border border-zinc-200 bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200">
                        {availabilityLabel(i.availability)}
                      </span>
                    ) : null}
                  </div>
                </KxListingCardMedia>
                <KxListingCardBody>
                  <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{i.title}</div>
                  {i.subtitle ? <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{i.subtitle}</div> : null}
                </KxListingCardBody>
              </KxListingCard>

              {isOwnProfile ? (
                <div className="flex flex-wrap gap-2">
                  {i.availability === 'live' && i.editHref ? (
                    <Link href={i.editHref} className="k-control-btn whitespace-nowrap">
                      Edit
                    </Link>
                  ) : null}
                  {i.availability === 'live' ? (
                    <button
                      type="button"
                      className="k-control-btn whitespace-nowrap !border-red-300 dark:!border-red-800 !text-red-700 dark:!text-red-300"
                      onClick={() => alert('Delete/unpublish will be wired to project APIs next.')}
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-2 py-2">
                      Controls coming soon
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatorCreateTab({
  kaspaAddress,
  isOwnProfile,
}: {
  kaspaAddress: string | null;
  isOwnProfile: boolean;
}) {
  if (!isOwnProfile) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Connect your wallet and open your own profile to access creator tools.
      </div>
    );
  }

  const returnTo = kaspaAddress ? `/u/${encodeURIComponent(kaspaAddress)}?tab=creator-content` : '/u?tab=creator-content';
  const tiles: Array<{
    key: string;
    title: string;
    description: string;
    href?: string;
    disabled?: boolean;
  }> = [
    { key: 'article', title: 'Create Article', description: 'Open the vBlog editor.', href: `/vblog/editor/new?returnTo=${encodeURIComponent(returnTo)}` },
    { key: 'mag', title: 'Create Magazine Issue', description: 'Open the magazines editor.', href: `/magazines/editor` },
    { key: 'product', title: 'Create Product', description: 'Open the store dashboard.', href: `/store/dashboard?tab=products` },
    { key: 'dapp', title: 'New dApp', description: 'Build or list a dApp.', href: `/dapps/editor/new?returnTo=${encodeURIComponent(returnTo)}` },
    { key: 'ads', title: 'Create Ad', description: 'Open Kasparex Ads create flow.', href: `/ads?create=1` },
    { key: 'crowdkas', title: 'New CrowdKAS Campaign', description: 'Open CrowdKAS Studio.', href: `/donations/studio` },
    { key: 'games', title: 'New Game', description: 'Coming soon.', disabled: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Create" />
        <Link href={returnTo} className="k-control-btn whitespace-nowrap">
          Back to content
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => {
          const cls =
            'kx-listing-card group block w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors dark:border-zinc-800 dark:bg-zinc-900';
          if (t.disabled || !t.href) {
            return (
              <div key={t.key} className={`${cls} opacity-60`}>
                <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t.description}</p>
              </div>
            );
          }
          return (
            <Link key={t.key} href={t.href} className={cls}>
              <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AssetsTab() {
  return (
    <div className="space-y-6">
      <Card title="Assets and history">
        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Asset library and generation history are being unified under Profile Hub. Use the links below while we complete final migration.
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ActionLink href="/dapps" label="Media and assets" />
          <ActionLink href="/activity" label="Generation history" />
        </div>
      </Card>
    </div>
  );
}

function KnsTab({
  kaspaAddress,
  primaryName,
  knsDomains,
  assets,
  isLoading,
}: {
  kaspaAddress: string | null;
  primaryName: string | null;
  knsDomains: string[] | null;
  assets: KnsAsset[] | null;
  isLoading: boolean;
}) {
  const cards = useMemo(() => {
    const fromDomains = (knsDomains || []).map((d) => String(d).trim()).filter(Boolean);
    if (fromDomains.length > 0) return fromDomains;
    const fromAssets = (assets || [])
      .map((a) => String((a as any).asset || (a as any).domain || '').trim())
      .filter(Boolean);
    return fromAssets;
  }, [assets, knsDomains]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionTitle title="KNS" />
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Primary: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{primaryName ? primaryName.toLowerCase() : '—'}</span>
              {primaryName ? <span className="ml-2"><CopyIconButton value={primaryName.toLowerCase()} label="Copy primary domain" /></span> : null}
            </div>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Assets: <span className="font-semibold">{String((assets || []).length)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <SectionTitle title="Owned domains" />
        {!kaspaAddress ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Resolve a Kaspa address to load domains.</div>
        ) : isLoading ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
        ) : cards.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">No domains found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.slice(0, 24).map((d) => {
              const name = String(d).toLowerCase();
              return (
                <KxListingCard key={name} accent="dapps" className="overflow-hidden">
                  <KxListingCardMedia aspectClass="aspect-[3/2]">
                    <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <div className="text-[18px] font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate w-full">
                        {name}
                      </div>
                    </div>
                  </KxListingCardMedia>
                  <KxListingCardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{name}</div>
                        <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">KNS domain</div>
                      </div>
                      <CopyIconButton value={name} label="Copy domain" />
                    </div>
                  </KxListingCardBody>
                </KxListingCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  displayName,
  bio,
  avatarUrl,
  bannerUrl,
  kaspaAddress,
  connectedEvmAddress,
  isLinking,
  onLinkEvm,
  onSave,
}: {
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  kaspaAddress: string | null;
  connectedEvmAddress: `0x${string}` | null;
  isLinking: boolean;
  onLinkEvm: (evmAddress: `0x${string}`) => Promise<void>;
  onSave: (updates: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string }) => void;
}) {
  const [name, setName] = useState(displayName);
  const [b, setB] = useState(bio);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [banner, setBanner] = useState(bannerUrl);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);
  useEffect(() => {
    setB(bio);
  }, [bio]);
  useEffect(() => {
    setAvatar(avatarUrl);
  }, [avatarUrl]);
  useEffect(() => {
    setBanner(bannerUrl);
  }, [bannerUrl]);

  return (
    <div className="space-y-6">
      <Card title="Profile settings (local draft)">
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4">
          For this first iteration, edits are saved locally. Next step is publishing to IPFS + registry updates with KAS-paid actions.
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
            <SectionTitle title="Link L2 wallet (proof)" />
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Canonical identity: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{kaspaAddress || '—'}</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
              Connected EVM: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{connectedEvmAddress || '—'}</span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={!connectedEvmAddress || !kaspaAddress || isLinking}
                onClick={async () => {
                  if (!connectedEvmAddress) return;
                  setLinkError(null);
                  setLinkSuccess(null);
                  try {
                    await onLinkEvm(connectedEvmAddress);
                    setLinkSuccess('Linked successfully (signature stored in draft).');
                  } catch (e: any) {
                    setLinkError(e?.message || 'Failed to link wallet');
                  }
                }}
                className={`k-control-btn flex-1 ${!connectedEvmAddress || !kaspaAddress || isLinking ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isLinking ? 'Signing…' : 'Link EVM wallet'}
              </button>
            </div>

            {linkError && (
              <div className="mt-3 text-[11px] font-semibold text-red-600 dark:text-red-400">
                {linkError}
              </div>
            )}
            {linkSuccess && (
              <div className="mt-3 text-[11px] font-semibold text-green-600 dark:text-green-400">
                {linkSuccess}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Avatar URL (or `ipfs://...`)</label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://... or ipfs://CID"
              className="k-input"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Banner URL (or `ipfs://...`)</label>
            <input
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://... or ipfs://CID"
              className="k-input"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="k-input"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Bio</label>
            <textarea
              value={b}
              onChange={(e) => setB(e.target.value)}
              rows={5}
              className="k-textarea resize-none"
              maxLength={500}
            />
            <div className="mt-1 text-xs font-semibold text-zinc-500 text-right">
              {b.length}/500
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() =>
                onSave({
                  displayName: name.trim(),
                  bio: b.trim(),
                  avatarUrl: avatar.trim() || undefined,
                  bannerUrl: banner.trim() || undefined,
                })
              }
              className="k-control-btn flex-1"
            >
              Save draft
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProfileHaloHeader({
  displayName,
  kaspaAddress,
  knsPrimaryName,
  knsDomains,
  bio,
  source,
  bannerUrl,
  avatarUrl,
  isOwnProfile,
  onEdit,
  onOpenKns,
}: {
  displayName: string;
  kaspaAddress: string | null;
  knsPrimaryName: string | null;
  knsDomains: string[] | null;
  bio: string;
  source: string;
  bannerUrl: string | null;
  avatarUrl: string | null;
  isOwnProfile: boolean;
  onEdit: () => void;
  onOpenKns: () => void;
}) {
  const subtitle = bio?.trim() || 'Unified Kasparex Hub profile for your L1 identity and linked wallets.';
  const visibleDomains = useMemo(() => {
    const primary = (knsPrimaryName || '').toLowerCase();
    const domains = (knsDomains || []).map((d) => String(d).toLowerCase());
    const uniq = Array.from(new Set(domains)).filter(Boolean);
    const withoutPrimary = primary ? uniq.filter((d) => d !== primary) : uniq;
    const displayed: string[] = [];
    if (primary) displayed.push(primary);
    for (const d of withoutPrimary) {
      if (displayed.length >= 5) break;
      displayed.push(d);
    }
    const remaining = Math.max(0, uniq.length - displayed.length);
    return { displayed, remaining };
  }, [knsDomains, knsPrimaryName]);
  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="absolute inset-0 overflow-hidden">
          {bannerUrl ? (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : null}
        </div>

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Avatar address={(knsPrimaryName || kaspaAddress || displayName).replace(/^kaspa:/i, '')} size={48} />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight truncate">
                    {displayName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isOwnProfile ? (
                      <span className="text-[12px] px-2 py-0.5 inline-flex rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-semibold border border-green-500/10">
                        Owner
                      </span>
                    ) : (
                      <span className="text-[12px] px-2 py-0.5 inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold border border-zinc-200 dark:border-zinc-700">
                        Public
                      </span>
                    )}
                    {visibleDomains.displayed.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-2 text-[12px] px-2 py-0.5 rounded-full bg-[#02abb8]/10 text-[#02abb8] font-semibold normal-case border border-[#02abb8]/20"
                      >
                        <span className="truncate max-w-[180px]">{d}</span>
                        <CopyIconButton value={d} label="Copy domain" />
                      </span>
                    ))}
                    {visibleDomains.remaining > 0 ? (
                      <button
                        type="button"
                        onClick={onOpenKns}
                        className="inline-flex items-center gap-2 text-[12px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold normal-case border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-colors"
                      >
                        +{visibleDomains.remaining}
                      </button>
                    ) : null}
                    {kaspaAddress && (
                      <span className="inline-flex items-center gap-2 text-[12px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold border border-zinc-200 dark:border-zinc-700">
                        <span className="normal-case">{formatKaspaAddress(kaspaAddress).display.toLowerCase()}</span>
                        <CopyIconButton value={formatKaspaAddress(kaspaAddress).full.toLowerCase()} label="Copy address" />
                      </span>
                    )}
                    {source !== 'none' && (
                      <span className="text-[12px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                        {source}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            {isOwnProfile ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onEdit}
                  className="k-control-btn"
                >
                  Edit
                </button>
                <Link
                  href={kaspaAddress ? `/u/${encodeURIComponent(kaspaAddress)}?tab=workspace` : '/u?tab=workspace'}
                  className="k-control-btn !bg-[#02abb8] hover:!bg-[#028a94] !text-white !border-[#02abb8]/30"
                >
                  Workspace
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileTabStrip({
  activeTab,
  isOwnProfile,
  onTab,
}: {
  activeTab: TabId;
  isOwnProfile: boolean;
  onTab: (t: TabId) => void;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const tabs: Array<{ id: TabId; label: string; ownerOnly?: boolean }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'creator-content', label: 'Content' },
    { id: 'creator-create', label: 'Create' },
    { id: 'ads', label: 'Ads' },
    { id: 'assets', label: 'Assets' },
    { id: 'kns', label: 'KNS' },
    { id: 'settings', label: 'Settings', ownerOnly: true },
  ];

  const allowedTabs = tabs.filter((t) => !t.ownerOnly || isOwnProfile);
  const visibleTabs = allowedTabs.slice(0, 4);
  const overflowTabs = allowedTabs.slice(4);
  return (
    <div className="mb-6">
      <div className="k-control-group w-full overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setOverflowOpen(false);
              onTab(t.id);
            }}
            className={`h-10 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}

        {overflowTabs.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOverflowOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
              className={`h-10 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                overflowTabs.some((t) => t.id === activeTab)
                  ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="sr-only">More tabs</span>
              <span aria-hidden className="text-lg leading-none">⋯</span>
            </button>
            {overflowOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 min-w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-50"
              >
                {overflowTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOverflowOpen(false);
                      onTab(t.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      activeTab === t.id
                        ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 900);
        } catch {
          // ignore
        }
      }}
      className="p-1 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
      aria-label={label}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="k-control-btn w-full justify-center"
    >
      {label}
    </Link>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full bg-[#02abb8]" />
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <SectionTitle title={title} />
      {children}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3">
      <div className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{value}</div>
    </div>
  );
}

