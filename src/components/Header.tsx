'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { KaspaL1WalletButton } from './KaspaL1WalletButton';
import { EVMWalletButton } from './EVMWalletButton';
import dynamic from 'next/dynamic';

const TestnetBanner = dynamic(
  () => import('./TestnetBanner').then((mod) => ({ default: mod.TestnetBanner })),
  { ssr: false }
);
import { useBalanceVisibility } from '@/hooks/useBalanceVisibility';
import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { HeaderRewardsPointsLink } from '@/components/HeaderRewardsPointsLink';
import { HubMegaMenu } from '@/components/hub/HubMegaMenu';
import { HubMenuSectionTitle } from '@/components/hub/hubMenuIcons';
import { MobileHeaderDrawer } from '@/components/MobileHeaderDrawer';
import { FooterSocialIcons } from '@/components/footer/FooterSocialIcons';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileWalletUnavailableNotice } from '@/components/hub/MobileWalletUnavailableNotice';

function AdminLink() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Tooltip content="Admin dashboard">
      <Link
        href="/admin"
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0 relative"
        aria-label="Admin dashboard"
      >
      <svg
        className="h-5 w-5 text-[#02abb8]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span className="absolute top-0 right-0 h-2 w-2 bg-[#02abb8] rounded-full"></span>
    </Link>
    </Tooltip>
  );
}



// Function to get current section title based on pathname
function getCurrentSectionTitle(pathname: string): string {
  if (pathname.startsWith('/defi')) {
    return 'DeFi';
  }
  if (pathname === '/dapps' || pathname.startsWith('/dapps/')) {
    return 'dApps';
  }
  if (pathname.startsWith('/protocols')) {
    return 'Protocols';
  }
  if (pathname.startsWith('/tokens')) {
    return 'Tokens';
  }
  if (pathname.startsWith('/vblog')) {
    return 'vBlog';
  }
  if (pathname.startsWith('/magazines')) {
    return 'Magazines';
  }
  if (pathname.startsWith('/chronicles')) {
    return 'Chronicles';
  }
  if (
    pathname.startsWith('/rewards') ||
    pathname.startsWith('/tiers')
  ) {
    return 'Rewards';
  }
  if (pathname.startsWith('/rewards-calculator')) {
    return 'Rewards';
  }
  if (pathname.startsWith('/tree')) {
    return 'Revenue Tree';
  }
  if (pathname.startsWith('/nft')) {
    return 'NFT Tools';
  }
  if (pathname.startsWith('/hub')) {
    return 'Hub';
  }
  if (pathname.startsWith('/store')) {
    return 'Store';
  }
  if (pathname.startsWith('/ai')) {
    return 'Kasparex AI';
  }
  if (pathname.startsWith('/games')) {
    return 'Games';
  }
  if (pathname.startsWith('/donations')) {
    return 'Donations';
  }
  if (pathname.startsWith('/ads')) {
    return 'Ads';
  }
  if (pathname.startsWith('/nodes')) {
    return 'Nodes';
  }
  if (pathname.startsWith('/stats')) {
    return 'Stats';
  }
  if (pathname.startsWith('/u')) {
    return 'Profile Hub';
  }
  // Default to dApps
  return 'dApps';
}

// Function to get current project based on pathname
function getCurrentProject(pathname: string): HubProject | null {
  // Normalize pathname for matching
  const normalizedPath = pathname === '/' ? '/dapps' : pathname;

  return hubProjects.find((project) => {
    if (project.route === normalizedPath) {
      return true;
    }
    if (normalizedPath.startsWith(project.route) && project.route !== '/') {
      return true;
    }
    return false;
  }) || null;
}

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isVisible: isBalanceVisible, toggleVisibility: toggleBalanceVisibility } = useBalanceVisibility();
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const isMobile = useIsMobileViewport();

  useBodyScrollLock(mobileMenuOpen && isMobile);

  // Close the drawer when RainbowKit connect / chain modals open so they are not obscured.
  useEffect(() => {
    if (!mobileMenuOpen || !isMobile) return;

    const closeIfWalletModal = () => {
      if (document.querySelector('[data-rk] [role="dialog"]')) {
        setMobileMenuOpen(false);
      }
    };

    closeIfWalletModal();
    const observer = new MutationObserver(closeIfWalletModal);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [mobileMenuOpen, isMobile]);

  const currentSectionTitle = getCurrentSectionTitle(pathname);
  const currentProject = getCurrentProject(pathname);

  // Check for new updates
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const response = await fetch('/api/updates');
        const result = await response.json();
        if (result.success && result.data) {
          const totalUpdates = (result.data.updates || []).length;
          const lastViewedCount = parseInt(
            localStorage.getItem('lastViewedUpdateCount') || '0',
            10
          );
          setUpdateCount(totalUpdates);
          setHasNewUpdates(totalUpdates > lastViewedCount);
        }
      } catch (error) {
        console.error('Error checking updates:', error);
      }
    };

    checkUpdates();
    // Check every 60 seconds
    const interval = setInterval(checkUpdates, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-950/80">
      <TestnetBanner />
      <div className="flex h-16 items-center justify-between w-full">
        {/* Left side: Logo and Title - no padding, flush to left */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 lg:pl-6">
          <Tooltip content={gameTooltipRich('Kasparex Hub', 'Explore dApps, games, rewards, and more.')} side="bottom" align="start">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3"
              aria-label="Kasparex Hub home"
            >
              {!logoError ? (
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 flex-shrink-0">
                  <Image
                    src="/kasparex-oval.png"
                    alt="Kasparex Logo"
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-12 sm:w-12">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-xl">K</span>
                </div>
              )}
              <h1 className="hidden md:flex items-center gap-2 whitespace-nowrap text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg lg:text-xl">
                <span className="uppercase">
                  <span className="font-bold">KASPA</span>
                  <span className="font-normal">REX</span>
                </span>
                <span className="text-[#02abb8]">𐤊</span>
              </h1>
            </Link>
          </Tooltip>
          <HubMegaMenu
            currentSectionTitle={currentSectionTitle}
            currentProject={currentProject}
            pathname={pathname}
          />
        </div>

        {/* Right side: desktop actions */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 lg:pr-6">
          <HeaderRewardsPointsLink />
          <AdminLink />
          <Tooltip content="What's new">
            <Link
              href="/updates"
              onClick={() => {
                localStorage.setItem('lastViewedUpdateCount', updateCount.toString());
                setHasNewUpdates(false);
              }}
              className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
              aria-label="What's new"
            >
            <svg
              className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {hasNewUpdates && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
            )}
          </Link>
          </Tooltip>
          <Tooltip content={isBalanceVisible ? 'Hide balances' : 'Show balances'}>
            <button
              onClick={toggleBalanceVisibility}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
              aria-label={isBalanceVisible ? 'Hide balances' : 'Show balances'}
            >
            {isBalanceVisible ? (
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
          </Tooltip>
          <Tooltip content={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 kaspa:hover:bg-[#231F20]/50 transition-colors flex-shrink-0"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
            {theme === 'dark' ? (
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400 kaspa:text-[#70C7BA]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : theme === 'light' ? (
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400 kaspa:text-[#70C7BA]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-[#70C7BA]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            )}
          </button>
          </Tooltip>
          <div className="flex-shrink-0">
            <KaspaL1WalletButton />
          </div>
          <div className="flex-shrink-0">
            <EVMWalletButton />
          </div>
        </div>

        {/* Mobile: theme + menu */}
        <div className="flex lg:hidden items-center gap-1 pr-1">
          <Tooltip content={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            <button
              type="button"
              onClick={toggleTheme}
              className="k-control-icon-btn"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="k-control-icon-btn"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <MobileHeaderDrawer open={mobileMenuOpen && isMobile} onClose={() => setMobileMenuOpen(false)}>
        <div className="flex flex-col gap-5 p-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <section>
            <HubMenuSectionTitle>Wallets</HubMenuSectionTitle>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 space-y-2.5">
              <MobileWalletUnavailableNotice networks="both" />
              <div className="kx-mobile-wallet-stack space-y-2.5">
                <EVMWalletButton />
                <KaspaL1WalletButton />
              </div>
            </div>
          </section>

          <section>
            <HubMenuSectionTitle>Account & tools</HubMenuSectionTitle>
            <div className="flex justify-center py-1">
              <HeaderRewardsPointsLink />
            </div>
            <div className="flex items-center justify-center gap-3 py-2">
              <AdminLink />
              <Tooltip content="What's new">
                <Link
                  href="/updates"
                  onClick={() => {
                    localStorage.setItem('lastViewedUpdateCount', updateCount.toString());
                    setHasNewUpdates(false);
                    setMobileMenuOpen(false);
                  }}
                  className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                  aria-label="What's new"
                >
                  <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {hasNewUpdates ? (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
                  ) : null}
                </Link>
              </Tooltip>
              <Tooltip content={isBalanceVisible ? 'Hide balances' : 'Show balances'}>
                <button
                  type="button"
                  onClick={toggleBalanceVisibility}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                  aria-label={isBalanceVisible ? 'Hide balances' : 'Show balances'}
                >
                  {isBalanceVisible ? (
                    <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </Tooltip>
              <Tooltip content={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                  {theme === 'dark' ? (
                    <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </Tooltip>
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-3 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2 text-center">
            Follow Kasparex
          </p>
          <FooterSocialIcons />
        </div>
      </MobileHeaderDrawer>
    </header>
  );
}

