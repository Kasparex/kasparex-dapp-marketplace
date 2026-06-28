'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
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
import { useInsDisplayName } from '@/hooks/useInsDisplayName';
import { INS_REGISTER_URL } from '@/lib/ins/config';
import { getInsNftImageUrl, isInsNameExpiringSoon } from '@/lib/ins/utils';
import type { InsOwnedName } from '@/lib/ins/client';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { buildLinkEvmMessage, verifyLinkEvmSignature } from '@/lib/profile/linking';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { useVBlog } from '@/hooks/useVBlog';
import type { VBlogArticle } from '@/lib/vblog/types';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { useKpxPublicIdentity } from '@/hooks/useKpxPublicIdentity';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';
import { TierBadge } from '@/components/rewards/TierBadge';
import { KREX_TIERS } from '@/lib/rewards/types';
import { getContractAddress } from '@/lib/contracts/addresses';
import { ProfileTransactionsTab } from '@/components/profile/ProfileTransactionsTab';
// heavy editors are opened as dedicated routes; keep Profile Hub lightweight

type TabId =
  | 'overview'
  | 'transactions'
  | 'creator-content'
  | 'creator-create'
  | 'assets'
  | 'kns'
  | 'ins'
  | 'settings';

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
  const chainId = useChainId();
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
  const kpxIdentity = useKpxPublicIdentity(kaspaAddress);

  const isOwnProfile = useMemo(() => {
    if (!kaspaAddress) return false;
    const connected = (kaspaState.address || '').toLowerCase();
    return Boolean(kaspaState.isConnected && connected && connected === kaspaAddress.toLowerCase());
  }, [kaspaAddress, kaspaState.address, kaspaState.isConnected]);

  const linkedEvmAddress = useMemo(() => {
    const addr = profile?.linkedEvmWallets?.[0]?.address;
    return addr ? String(addr).toLowerCase() as `0x${string}` : null;
  }, [profile?.linkedEvmWallets]);

  const connectedEvm = useMemo(() => {
    if (!isEvmConnected || !connectedEvmAddress) return null;
    return String(connectedEvmAddress).toLowerCase() as `0x${string}`;
  }, [isEvmConnected, connectedEvmAddress]);

  const insWalletAddress = useMemo(() => {
    if (linkedEvmAddress) return linkedEvmAddress;
    if (isOwnProfile && connectedEvm) return connectedEvm;
    return null;
  }, [linkedEvmAddress, isOwnProfile, connectedEvm]);

  const {
    displayName: insDisplayName,
    primaryName: insPrimaryName,
    names: insOwnedNames,
    hasIns,
    isLoading: isInsLoading,
  } = useInsDisplayName(insWalletAddress, { enabled: Boolean(insWalletAddress) });

  const insExpiringSoon = useMemo(() => {
    return insOwnedNames.filter((n) => isInsNameExpiringSoon(n.expires_at, n.tenure));
  }, [insOwnedNames]);

  const insDomains = useMemo(() => {
    return insOwnedNames.map((n) => String(n.name).toLowerCase()).filter(Boolean).sort();
  }, [insOwnedNames]);

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
      // legacy mapping
      setActiveTab('creator-create');
      router.replace(hrefTab('creator-create'));
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
      'transactions',
      'creator-content',
      'creator-create',
      'assets',
      'kns',
      'ins',
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

            <SidebarSection title="Profile">
              <nav className="space-y-0.5">
                <SidebarNavItem
                  label="Overview"
                  active={activeTab === 'overview'}
                  onClick={() => goTab('overview')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                />
                <SidebarNavItem
                  label="Transactions"
                  active={activeTab === 'transactions'}
                  onClick={() => goTab('transactions')}
                  icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4-8V7a2 2 0 00-2-2H5a2 2 0 00-2 2v2m18 0H3m18 0v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8" /></svg>}
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
                {hasIns ? (
                  <SidebarNavItem
                    label="INS"
                    active={activeTab === 'ins'}
                    onClick={() => goTab('ins')}
                    icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                  />
                ) : null}
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
                  insPrimaryName={insDisplayName}
                  insDomains={hasIns ? insDomains : null}
                  linkedEvmAddress={insWalletAddress}
                  bio={profile?.bio?.trim() || knsProfile?.bio || ''}
                  source={source}
                  bannerUrl={bannerUrl}
                  avatarUrl={avatarUrl}
                  isOwnProfile={isOwnProfile}
                  kpxDisplay={kpxIdentity.kpxDisplay}
                  kpxKasparexVerified={kpxIdentity.kpxKasparexVerified}
                  kpxIdentityLoading={kpxIdentity.loading}
                  onEdit={() => goTab('settings')}
                  onOpenKns={() => goTab('kns')}
                  onOpenIns={() => goTab('ins')}
                />

                <ProfileTabStrip
                  activeTab={activeTab}
                  isOwnProfile={isOwnProfile}
                  hasIns={hasIns}
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
                    isOwnProfile={isOwnProfile}
                  />
                )}

                {activeTab === 'transactions' && (
                  <ProfileTransactionsTab
                    kaspaAddress={kaspaAddress}
                    linkedEvmAddress={profile?.linkedEvmWallets?.[0]?.address || null}
                    chainId={chainId}
                  />
                )}

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

                {activeTab === 'ins' && insWalletAddress && hasIns && (
                  <InsTab
                    linkedEvmAddress={insWalletAddress}
                    primaryName={insDisplayName}
                    names={insOwnedNames}
                    expiringSoon={insExpiringSoon}
                    isLoading={isInsLoading}
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
                    linkedEvmAddress={linkedEvmAddress}
                    insPrimaryName={insDisplayName}
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
  isOwnProfile,
}: {
  kaspaAddress: string | null;
  knsProfile: KnsDomainProfileResponse | null;
  profileBio: string;
  profileWebsite?: string;
  profileGithub?: string;
  profileX?: string;
  profileHref: string;
  isOwnProfile: boolean;
}) {
  const website = profileWebsite || knsProfile?.website;
  const github = profileGithub || knsProfile?.github;
  const x = profileX || knsProfile?.x || knsProfile?.twitter;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Bio">
          <div className="kx-body text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
            {(profileBio || knsProfile?.bio || 'No bio yet.').trim()}
          </div>
        </Card>

        <Card title="Public links">
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoPill label="Website" value={website || '-'} />
            <InfoPill label="GitHub" value={github || ' - '} />
            <InfoPill label="X" value={x || ' - '} />
            <InfoPill label="Kaspa" value={kaspaAddress ? formatKaspaAddress(kaspaAddress).display : ' - '} />
          </div>
        </Card>

        {isOwnProfile ? <PortfolioOverview /> : null}
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

function PortfolioOverview() {
  const { isConnected: isEVMConnected } = useAccount();
  const portfolioChainId = useChainId();
  const { state: kaspaState } = useKaspaWallet();
  const isL1Connected = kaspaState.isConnected;

  const { balance: krexBalance, l1Balance: krexL1, l2Balance: krexL2, tier: krexTier, isLoading: isKREXLoading } = useKREXBalance();
  const { balanceInKas: kasBalance, isLoading: isKasLoading } = useKaspaBalance();
  const gridTokenAddress =
    getContractAddress(portfolioChainId, 'tGRID') || getContractAddress(portfolioChainId, 'GRIDToken') || undefined;
  const gridToken = useGRIDToken(gridTokenAddress);
  const { nftStatus, nftPoints } = useNFTStatus();
  const { totalRedeemable: hubPts } = useRedeemablePointsBreakdown();

  const krexMultiplier = KREX_TIERS[krexTier].multiplier;
  const nftMultiplierAdd =
    nftStatus?.hasRarestNFT
      ? 5
      : nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX
        ? 3
        : nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX
          ? 1
          : 0;
  const totalMultiplier = krexMultiplier + nftMultiplierAdd;

  return (
    <Card title="Portfolio">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard
          symbol="KAS"
          name="Kaspa Native"
          balance={kasBalance || 0}
          isLoading={isKasLoading}
          color="cyan"
          tokenId="kas"
          isConnected={isL1Connected}
        />
        <BalanceCard
          symbol="KREX"
          name="Ecosystem Token"
          balance={krexBalance}
          isLoading={isKREXLoading}
          color="emerald"
          tokenId="krex"
          isConnected={isL1Connected || isEVMConnected}
          extra={`L1: ${formatLargeNumber(krexL1)} | L2: ${formatLargeNumber(krexL2)}`}
        />
        <BalanceCard
          symbol="GRID"
          name="Ecosystem Reward"
          balance={Number(String(gridToken.formattedBalance || '0').replace(/,/g, ''))}
          isLoading={gridToken.isLoading}
          color="indigo"
          tokenId="grid"
          isConnected={isEVMConnected}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total Multiplier</div>
            <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">{totalMultiplier}x</div>
          </div>
        </div>
        <div className="space-y-4">
          <RewardItem label="KREX Tier" value={KREX_TIERS[krexTier].label} icon={<TierBadge tier={krexTier} isUnlocked={true} />} />
          <RewardItem label="Hub pts" value={formatLargeNumber(hubPts)} icon="✨" />
          <RewardItem label="NFT Points" value={String(nftPoints)} icon="🖼️" />
          <RewardItem label="Active boosts" value={`${nftMultiplierAdd}x active`} icon="🚀" />
        </div>
      </div>
    </Card>
  );
}

function BalanceCard({
  symbol,
  name,
  balance,
  isLoading,
  color,
  tokenId,
  isConnected,
  extra,
}: {
  symbol: string;
  name: string;
  balance: number;
  isLoading: boolean;
  color: 'cyan' | 'emerald' | 'indigo';
  tokenId: 'kas' | 'krex' | 'grid';
  isConnected: boolean;
  extra?: string;
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-500 shadow-cyan-500/5',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-500 shadow-emerald-500/5',
    indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-500 shadow-indigo-500/5',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} bg-white dark:bg-zinc-900 rounded-2xl border p-5 dark:shadow-none transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
          <TokenLogoImage tokenId={tokenId} size={24} />
        </div>
        {!isConnected ? (
          <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold uppercase border border-red-500/10">
            Disconnected
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-bold uppercase border border-green-500/10">
            Live
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">{name}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
            {isLoading ? <div className="w-24 h-7 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" /> : isConnected ? formatLargeNumber(balance) : '0'}
          </div>
          <div className="text-sm font-bold text-zinc-500 uppercase">{symbol}</div>
        </div>
        {extra && <div className="text-[10px] text-zinc-400 font-medium pt-2">{extra}</div>}
      </div>
    </div>
  );
}

function RewardItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center border border-zinc-100 dark:border-zinc-700 transition-transform group-hover:scale-105">
          {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
        </div>
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</span>
    </div>
  );
}

// Workspace tab removed; Creator Hub + project editors live under Create + dedicated routes.

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
  excerpt?: string;
  imageUrl?: string;
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
  const searchParams = useSearchParams();
  const urlType = (searchParams?.get('type') || '').toLowerCase();
  useEffect(() => {
    const allowed: Array<CreatorContentType | 'all'> = ['all', 'dapps', 'articles', 'crowdkas', 'products', 'magazines', 'ads'];
    if (allowed.includes(urlType as any)) {
      setTypeFilter(urlType as any);
    }
  }, [urlType]);

  const { articles, isLoading: vblogLoading } = useVBlog();

  const normalizedKaspa = useMemo(() => {
    if (!kaspaAddress) return null;
    try {
      return normalizeKaspaAddress(kaspaAddress).toLowerCase();
    } catch {
      return kaspaAddress.toLowerCase();
    }
  }, [kaspaAddress]);

  const creatorArticles = useMemo(() => {
    if (!normalizedKaspa) return [] as VBlogArticle[];
    return (articles || []).filter((a) => String(a.author || '').toLowerCase() === normalizedKaspa);
  }, [articles, normalizedKaspa]);

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

    const articlesCards: CreatorCardItem[] = creatorArticles.map((a) => {
      const isPublished =
        a.status === 'published' || a.status === 'verified' || a.status === 'on-chain-ready';
      return {
        id: a.id,
      type: 'articles',
      title: a.title,
      subtitle: 'Kasparex vBlog',
      excerpt: (a.description || a.content || '').trim(),
      imageUrl: a.featuredImage?.trim() || undefined,
      status: isPublished ? 'published' : 'draft',
      availability: 'live',
      publicHref: `/vblog/${encodeURIComponent(a.slug)}`,
      editHref: `/vblog/editor/${encodeURIComponent(a.id)}`,
      accent: 'vblog',
      } satisfies CreatorCardItem;
    });

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
      editHref: '/ads/editor/new',
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

    return [...dapps, ...articlesCards, ...crowdkas, ...products, ...magazines, ...ads];
  }, [creatorArticles, linkedEvmAddress]);

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
          <Link href={kaspaAddress ? `/u/${encodeURIComponent(kaspaAddress)}` : '/u'} className="k-control-btn whitespace-nowrap">
            Public profile
          </Link>
          {isOwnProfile ? (
            <Link href="/u?tab=creator-create" className="k-control-btn whitespace-nowrap">
              Create new
            </Link>
          ) : null}
        </div>
      </div>

      {typeFilter === 'articles' || typeFilter === 'all' ? (
        vblogLoading ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            Loading articles…
          </div>
        ) : null
      ) : null}

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
              <KxListingCard href={i.publicHref} accent={i.accent} className="relative flex flex-col overflow-hidden">
                <KxListingCardMedia aspectClass="aspect-[3/2]">
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
                  {i.imageUrl ? (
                    <div
                      className="absolute inset-0 opacity-90"
                      style={{
                        backgroundImage: `url(${i.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ContentTypeIcon type={i.type} />
                  </div>
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
                <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
                  <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{i.title}</div>
                  {i.excerpt ? (
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {i.excerpt}
                    </p>
                  ) : null}
                  {i.subtitle ? (
                    <div className="mt-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      {i.subtitle}
                    </div>
                  ) : null}
                </KxListingCardBody>
              </KxListingCard>

              {isOwnProfile ? (
                <div className="flex flex-wrap gap-2">
                  <Link href={i.publicHref} className="k-control-btn whitespace-nowrap">
                    Open
                  </Link>
                  {i.availability === 'live' && i.editHref ? (
                    <Link href={i.editHref} className="k-control-btn whitespace-nowrap">
                      Edit
                    </Link>
                  ) : null}
                  {i.availability !== 'live' ? (
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-2 py-2">
                      Controls coming soon
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Link href={i.publicHref} className="k-control-btn whitespace-nowrap">
                    Open
                  </Link>
                </div>
              )}
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
    { key: 'ads', title: 'Create Ad', description: 'Open Kasparex Ads editor.', href: `/ads/editor/new?returnTo=${encodeURIComponent(returnTo)}` },
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

function ContentTypeIcon({ type }: { type: CreatorContentType }) {
  const common = 'h-12 w-12 text-zinc-400 dark:text-zinc-600';
  if (type === 'articles') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (type === 'dapps') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (type === 'products') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  }
  if (type === 'magazines') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  if (type === 'crowdkas') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
    </svg>
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
              Primary: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{primaryName ? primaryName.toLowerCase() : ' - '}</span>
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

function InsTab({
  linkedEvmAddress,
  primaryName,
  names,
  expiringSoon,
  isLoading,
}: {
  linkedEvmAddress: string;
  primaryName: string | null;
  names: InsOwnedName[];
  expiringSoon: InsOwnedName[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {expiringSoon.length > 0 ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {expiringSoon.length} annual name{expiringSoon.length === 1 ? '' : 's'} expiring within 60 days
          </div>
          <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Renew on{' '}
            <a href={INS_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              insdomains.org
            </a>{' '}
            to keep your .igra names active.
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionTitle title="INS" />
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Linked EVM:{' '}
              <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{linkedEvmAddress}</span>
            </div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Primary:{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {primaryName ? primaryName.toLowerCase() : ' - '}
              </span>
              {primaryName ? (
                <span className="ml-2">
                  <CopyIconButton value={primaryName.toLowerCase()} label="Copy primary domain" />
                </span>
              ) : null}
            </div>
          </div>
          <a
            href={INS_REGISTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="k-control-btn !bg-[#02abb8] hover:!bg-[#028a94] !text-white !border-[#02abb8]/30 text-center"
          >
            Manage on insdomains.org
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <SectionTitle title="Owned .igra names" />
        {isLoading ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
        ) : names.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            No INS names found for the linked EVM wallet.{' '}
            <a href={INS_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="text-[#02abb8] font-semibold underline">
              Register a name
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {names.slice(0, 24).map((n) => {
              const name = String(n.name).toLowerCase();
              const imgUrl = n.tokenId ? getInsNftImageUrl(n.tokenId, n.registry_version) : null;
              const tenure = n.tenure === 'annual' ? 'Annual' : n.tenure === 'forever' ? 'Forever' : null;
              const expiring = isInsNameExpiringSoon(n.expires_at, n.tenure);
              return (
                <KxListingCard key={name} accent="dapps" className="overflow-hidden">
                  <KxListingCardMedia aspectClass="aspect-[3/2]">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                          <div className="text-[18px] font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate w-full">
                            {name}
                          </div>
                        </div>
                      </>
                    )}
                  </KxListingCardMedia>
                  <KxListingCardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{name}</div>
                        <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                          {tenure || 'INS domain'}
                          {n.expires_at && n.tenure === 'annual'
                            ? ` · expires ${new Date(n.expires_at).toLocaleDateString()}`
                            : ''}
                          {expiring ? ' · renew soon' : ''}
                        </div>
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
  linkedEvmAddress,
  insPrimaryName,
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
  linkedEvmAddress: `0x${string}` | null;
  insPrimaryName: string | null;
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
              Canonical identity: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{kaspaAddress || ' - '}</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
              Connected EVM: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{connectedEvmAddress || ' - '}</span>
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
            {linkedEvmAddress && insPrimaryName ? (
              <div className="mt-3 rounded-lg border border-[#02abb8]/20 bg-[#02abb8]/5 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">INS unlocked</div>
                <div className="text-sm font-semibold text-[#02abb8] mt-0.5">{insPrimaryName}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  View your .igra names in the INS tab.
                </div>
              </div>
            ) : linkedEvmAddress ? (
              <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                EVM wallet linked. Register a name at{' '}
                <a href={INS_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="text-[#02abb8] font-semibold underline">
                  insdomains.org
                </a>{' '}
                to enable INS on your profile.
              </div>
            ) : null}
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
  insPrimaryName,
  insDomains,
  linkedEvmAddress,
  bio,
  source,
  bannerUrl,
  avatarUrl,
  isOwnProfile,
  kpxDisplay,
  kpxKasparexVerified,
  kpxIdentityLoading,
  onEdit,
  onOpenKns,
  onOpenIns,
}: {
  displayName: string;
  kaspaAddress: string | null;
  knsPrimaryName: string | null;
  knsDomains: string[] | null;
  insPrimaryName: string | null;
  insDomains: string[] | null;
  linkedEvmAddress: string | null;
  bio: string;
  source: string;
  bannerUrl: string | null;
  avatarUrl: string | null;
  isOwnProfile: boolean;
  kpxDisplay: string | null;
  kpxKasparexVerified: boolean;
  kpxIdentityLoading: boolean;
  onEdit: () => void;
  onOpenKns: () => void;
  onOpenIns: () => void;
}) {
  const subtitle = bio?.trim() || 'Unified Kasparex Hub profile for your L1 identity and linked wallets.';
  const visibleInsDomains = useMemo(() => {
    const primary = (insPrimaryName || '').toLowerCase();
    const domains = (insDomains || []).map((d) => String(d).toLowerCase());
    const uniq = Array.from(new Set(domains)).filter(Boolean);
    const withoutPrimary = primary ? uniq.filter((d) => d !== primary) : uniq;
    const displayed: string[] = [];
    if (primary) displayed.push(primary);
    for (const d of withoutPrimary) {
      if (displayed.length >= 3) break;
      displayed.push(d);
    }
    const remaining = Math.max(0, uniq.length - displayed.length);
    return { displayed, remaining };
  }, [insDomains, insPrimaryName]);

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
                  {!kpxIdentityLoading && kpxDisplay ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      <span className="font-bold text-[#02abb8]">kpx/pf</span>{' '}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{kpxDisplay}</span>
                      <Link
                        href="/protocols/kpx-tools"
                        className="ml-2 text-[11px] font-bold text-zinc-500 hover:text-[#02abb8] underline-offset-2 hover:underline"
                      >
                        broadcast
                      </Link>
                    </p>
                  ) : null}
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
                    {!kpxIdentityLoading && kpxKasparexVerified ? (
                      <span className="text-[12px] px-2 py-0.5 inline-flex rounded-full bg-[#02abb8]/15 text-[#02abb8] font-black border border-[#02abb8]/25">
                        Kasparex verified
                      </span>
                    ) : null}
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
                    {linkedEvmAddress && visibleInsDomains.displayed.map((d) => (
                      <span
                        key={`ins-${d}`}
                        className="inline-flex items-center gap-2 text-[12px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold normal-case border border-indigo-500/20"
                      >
                        <span className="truncate max-w-[180px]">{d}</span>
                        <CopyIconButton value={d} label="Copy INS domain" />
                      </span>
                    ))}
                    {linkedEvmAddress && visibleInsDomains.remaining > 0 ? (
                      <button
                        type="button"
                        onClick={onOpenIns}
                        className="inline-flex items-center gap-2 text-[12px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold normal-case border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                      >
                        +{visibleInsDomains.remaining} INS
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

              <p className="mt-4 kx-body max-w-3xl leading-relaxed">
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
                  href={kaspaAddress ? `/u/${encodeURIComponent(kaspaAddress)}?tab=creator-content` : '/u?tab=creator-content'}
                  className="k-control-btn !bg-[#02abb8] hover:!bg-[#028a94] !text-white !border-[#02abb8]/30"
                >
                  Creator hub
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
  hasIns,
  onTab,
}: {
  activeTab: TabId;
  isOwnProfile: boolean;
  hasIns: boolean;
  onTab: (t: TabId) => void;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tabs: Array<{ id: TabId; label: string; ownerOnly?: boolean; requiresIns?: boolean }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'creator-content', label: 'Content' },
    { id: 'creator-create', label: 'Create' },
    { id: 'assets', label: 'Assets' },
    { id: 'kns', label: 'KNS' },
    { id: 'ins', label: 'INS', requiresIns: true },
    { id: 'settings', label: 'Settings', ownerOnly: true },
  ];

  const allowedTabs = tabs.filter((t) => {
    if (t.ownerOnly && !isOwnProfile) return false;
    if (t.requiresIns && !hasIns) return false;
    return true;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth + 8);
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [allowedTabs.length]);

  const visibleCount = isOverflowing ? 5 : allowedTabs.length;
  const visibleTabs = allowedTabs.slice(0, visibleCount);
  const overflowTabs = allowedTabs.slice(visibleCount);

  return (
    <div className="mb-6">
      <div ref={containerRef} className="k-control-group w-full overflow-x-auto">
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

