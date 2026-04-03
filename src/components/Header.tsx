'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useTheme } from './ThemeProvider';
import { UserMenu } from './UserMenu';
import { useAdmin } from '@/hooks/useAdmin';

const TestnetBanner = dynamic(
  () => import('./TestnetBanner').then((mod) => ({ default: mod.TestnetBanner })),
  { ssr: false }
);

const KaspaL1WalletButton = dynamic(
  () => import('./KaspaL1WalletButton').then((mod) => ({ default: mod.KaspaL1WalletButton })),
  { ssr: false }
);

const EVMWalletButton = dynamic(
  () => import('./EVMWalletButton').then((mod) => ({ default: mod.EVMWalletButton })),
  { ssr: false }
);
import { useBalanceVisibility } from '@/hooks/useBalanceVisibility';
import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { HeaderLeaderboardLink } from '@/components/HeaderLeaderboardLink';

function AdminLink() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0 relative"
      aria-label="Admin Dashboard"
      title="Admin Dashboard"
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
  );
}



// Function to get current section title based on pathname
function getCurrentSectionTitle(pathname: string): string {
  if (pathname.startsWith('/defi')) {
    return 'DeFi';
  }
  if (pathname === '/' || pathname.startsWith('/dapps')) {
    return 'dApps';
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
    pathname.startsWith('/rewards-and-points') ||
    pathname.startsWith('/rewards') ||
    pathname.startsWith('/points') ||
    pathname.startsWith('/tiers')
  ) {
    return 'Rewards';
  }
  if (pathname.startsWith('/leaderboard')) {
    return 'Leaderboard';
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
  if (pathname.startsWith('/studio')) {
    return 'Studio';
  }
  // Default to dApps
  return 'dApps';
}

// Function to get current project based on pathname
function getCurrentProject(pathname: string): HubProject | null {
  // Normalize pathname for matching
  const normalizedPath = pathname === '/' ? '/' : pathname;

  // Find matching project
  return hubProjects.find(project => {
    if (project.route === normalizedPath) {
      return true;
    }
    // Handle routes that start with the project route
    if (normalizedPath.startsWith(project.route) && project.route !== '/') {
      return true;
    }
    return false;
  }) || null;
}

// Function to get icon component for project
function getProjectIcon(projectId: string) {
  const iconMap: Record<string, (props: { className?: string }) => React.ReactElement> = {
    'kasparex-dapps': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'kasparex-records': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    'kasparex-tokens': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'kasparex-games': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'kasparex-vblog': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    'kasparex-magazines': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    'krex-chronicles': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'kasparex-movies': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    'kasparex-defi': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    'kasparex-studio': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    'krex-nodes': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    'kasparex-rewards': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    'kasparex-nft-tools': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    'kasparex-store': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
    ),
    'kasparex-donations': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    'revenue-tree': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  return iconMap[projectId] || iconMap['kasparex-dapps'];
}

// Function to get status badge component
function getStatusBadge(status: HubProject['status'], isActive: boolean = false) {
  // Smaller badge styling
  const baseClasses = "px-1.5 py-0.5 text-[10px] font-medium rounded";

  if (isActive) {
    // Active state badges with subtle styling
    switch (status) {
      case 'demo':
        return (
          <span className={`${baseClasses} bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300`}>
            Demo
          </span>
        );
      case 'beta':
        return (
          <span className={`${baseClasses} bg-purple-100/80 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300`}>
            Beta
          </span>
        );
      case 'coming-soon':
        return (
          <span className={`${baseClasses} bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300`}>
            Coming Soon
          </span>
        );
      default:
        return null;
    }
  }

  // Default state badges
  switch (status) {
    case 'demo':
      return (
        <span className={`${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300`}>
          Demo
        </span>
      );
    case 'beta':
      return (
        <span className={`${baseClasses} bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300`}>
          Beta
        </span>
      );
    case 'coming-soon':
      return (
        <span className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300`}>
          Coming Soon
        </span>
      );
    default:
      return null;
  }
}

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useAccount();
  const { isVisible: isBalanceVisible, toggleVisibility: toggleBalanceVisibility } = useBalanceVisibility();
  const [logoError, setLogoError] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSectionTitle = getCurrentSectionTitle(pathname);
  const currentProject = getCurrentProject(pathname);
  const currentProjectStatus = currentProject?.status || null;

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 relative group"
            title="Back to main page"
          >
            {!logoError ? (
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  K
                </span>
              </div>
            )}
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex items-center gap-2">
              <span className="uppercase">
                <span className="font-bold">KASPA</span>
                <span className="font-normal">REX</span>
              </span>
              <span className="text-[#02abb8]">𐤊</span>
            </h1>
            {/* Tooltip */}
            <span className="absolute left-0 top-full mt-2 px-2 py-1 text-xs text-white bg-zinc-900 dark:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Back to main page
            </span>
          </Link>
          <span className="relative">
            <div
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
                setMegaMenuOpen(true);
              }}
              onMouseLeave={() => {
                hoverTimeoutRef.current = setTimeout(() => {
                  setMegaMenuOpen(false);
                }, 500);
              }}
              className="inline-flex items-center gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <button
                  className="text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] transition-colors"
                >
                  {currentSectionTitle}
                </button>
                {currentProjectStatus && getStatusBadge(currentProjectStatus)}
              </div>
              <svg
                className="w-4 h-4 text-zinc-900 dark:text-zinc-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {megaMenuOpen && (
                <div
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      setMegaMenuOpen(false);
                    }, 500);
                  }}
                  className="absolute top-full left-0 mt-2 w-[800px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[9999] overflow-hidden"
                >
                  <div className="p-2">
                    <div className="grid grid-cols-3 gap-1">
                      {hubProjects.map((project) => {
                        const isExternal = project.route.startsWith('http');

                        // Check if this is the current page
                        const isCurrentPage = currentProject?.id === project.id;

                        // Normalize pathname for matching
                        const normalizedPath = pathname === '/' ? '/' : pathname;
                        const matchesRoute = project.route === normalizedPath ||
                          (normalizedPath.startsWith(project.route) && project.route !== '/');

                        const isActive = isCurrentPage || matchesRoute;
                        const ProjectIcon = getProjectIcon(project.id);

                        const linkClassName = `flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap group ${isActive
                          ? 'k-sidebar-item-active'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                          }`;

                        const linkContent = (
                          <>
                            <ProjectIcon className="w-4 h-4 k-sidebar-icon text-zinc-600 dark:text-zinc-400 group-hover:text-[#02abb8] transition-colors" />
                            <span className="font-medium">{project.name}</span>
                          </>
                        );

                        if (isExternal) {
                          return (
                            <a
                              key={project.id}
                              href={project.route}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkClassName}
                            >
                              {linkContent}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={project.id}
                            href={project.route}
                            className={linkClassName}
                          >
                            {linkContent}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </span>
        </div>

        {/* Right side: Wallet Connect and Theme Toggle - no padding, flush to right */}
        <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 lg:pr-6">
          <AdminLink />
          <HeaderLeaderboardLink />
          <button
            onClick={toggleBalanceVisibility}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            title={isBalanceVisible ? 'Hide wallet balances' : 'Show wallet balances'}
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
          <Link
            href="/updates"
            onClick={() => {
              // Mark updates as viewed
              localStorage.setItem('lastViewedUpdateCount', updateCount.toString());
              setHasNewUpdates(false);
            }}
            className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            aria-label="View updates timeline"
            title="Development Timeline"
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
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 kaspa:hover:bg-[#231F20]/50 transition-colors flex-shrink-0"
            aria-label="Toggle theme"
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
          <div className="flex-shrink-0">
            <KaspaL1WalletButton />
          </div>
          <div className="flex-shrink-0">
            <Suspense fallback={<div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs sm:text-sm">Loading...</div>}>
              <EVMWalletButton />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

