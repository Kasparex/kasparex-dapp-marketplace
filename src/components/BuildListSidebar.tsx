'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DescriptionIcon, UtilityIcon, ProcessIcon, BenefitsIcon, DeveloperIcon } from '@/components/icons/SectionIcons';

interface BuildListSidebarProps {
  title: string;
}

export function BuildListSidebar({ title }: BuildListSidebarProps) {
  const [overviewExpanded, setOverviewExpanded] = useState(true);
  const [requirementsExpanded, setRequirementsExpanded] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [guidelinesExpanded, setGuidelinesExpanded] = useState(false);
  const [resourcesExpanded, setResourcesExpanded] = useState(false);

  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const CollapsibleSection = ({
    title: sectionTitle,
    icon,
    expanded,
    onToggle,
    children,
  }: {
    title: string;
    icon?: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-semibold text-zinc-700 dark:text-white opacity-80 uppercase tracking-wider mb-2 hover:text-zinc-700 dark:hover:text-white hover:opacity-100 transition-all"
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-zinc-700 dark:text-white opacity-80">{icon}</span>
          )}
          <span>{sectionTitle}</span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Back Button */}
      <div className="lg:hidden px-4 pt-4">
        <Link
          href="/hub"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Go back to Hub
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
          <div className="p-4 lg:p-6">
            {/* Back to Hub Button */}
            <Link
              href="/hub"
              className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Go back to Hub
            </Link>

            {/* Page Title */}
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              {title}
            </h2>

            {/* Contextual Content Based on Page */}
            {title === 'Build dApp' ? (
              <>
                <CollapsibleSection
                  title="Overview"
                  icon={<DescriptionIcon />}
                  expanded={overviewExpanded}
                  onToggle={() => setOverviewExpanded(!overviewExpanded)}
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    Create and deploy your dApp on the Kasparex marketplace. Follow the step-by-step wizard to build your dApp from scratch.
                  </p>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside">
                    <li>Fill in basic information</li>
                    <li>Add media and links</li>
                    <li>Link or deploy smart contract</li>
                    <li>Configure subscriptions (optional)</li>
                    <li>Review and submit</li>
                  </ul>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Requirements"
                  icon={<UtilityIcon />}
                  expanded={requirementsExpanded}
                  onToggle={() => setRequirementsExpanded(!requirementsExpanded)}
                >
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside">
                    <li>Connected wallet (EVM compatible)</li>
                    <li>dApp name and description</li>
                    <li>Category selection</li>
                    <li>Utility and process description</li>
                    <li>Smart contract address (optional)</li>
                  </ul>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Benefits"
                  icon={<BenefitsIcon />}
                  expanded={guidelinesExpanded}
                  onToggle={() => setGuidelinesExpanded(!guidelinesExpanded)}
                >
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span>💰</span>
                      <span>Earn revenue from usage and subscriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>📈</span>
                      <span>Get visibility in the marketplace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>🔗</span>
                      <span>On-chain verification via DAppRegistry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>🔔</span>
                      <span>Configure subscription models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>📊</span>
                      <span>Track analytics and performance</span>
                    </li>
                  </ul>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Resources"
                  icon={<DeveloperIcon />}
                  expanded={resourcesExpanded}
                  onToggle={() => setResourcesExpanded(!resourcesExpanded)}
                >
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <p className="font-medium mb-2">Helpful Links:</p>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/u?tab=my-dapps&view=list-dapp" className="text-[#02abb8] hover:underline">
                          View My dApps →
                        </Link>
                      </li>
                      <li>
                        <Link href="/dapps" className="text-[#02abb8] hover:underline">
                          Browse Marketplace →
                        </Link>
                      </li>
                    </ul>
                  </div>
                </CollapsibleSection>
              </>
            ) : (
              <>
                <CollapsibleSection
                  title="Overview"
                  icon={<DescriptionIcon />}
                  expanded={overviewExpanded}
                  onToggle={() => setOverviewExpanded(!overviewExpanded)}
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    Manage all your dApps in one place. View analytics, configure subscriptions, track revenue, and edit your listings.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span>View and manage all your dApps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span>Track revenue and earnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🔔</span>
                      <span>Configure subscription plans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span>View analytics and insights</span>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Quick Actions"
                  icon={<UtilityIcon />}
                  expanded={requirementsExpanded}
                  onToggle={() => setRequirementsExpanded(!requirementsExpanded)}
                >
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <Link href="/u?tab=my-dapps&view=build-dapp" className="block text-[#02abb8] hover:underline">
                      ➕ Build New dApp
                    </Link>
                    <Link href="/dapps" className="block text-[#02abb8] hover:underline">
                      🔍 Browse Marketplace
                    </Link>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Revenue Tips"
                  icon={<BenefitsIcon />}
                  expanded={guidelinesExpanded}
                  onToggle={() => setGuidelinesExpanded(!guidelinesExpanded)}
                >
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside">
                    <li>Register contracts on DAppRegistry for on-chain verification</li>
                    <li>Configure subscription plans to enable recurring revenue</li>
                    <li>Revenue is automatically distributed via Treasury contract</li>
                    <li>Track your earnings in the Revenue dashboard</li>
                    <li>Update pricing anytime to optimize revenue</li>
                  </ul>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Best Practices"
                  icon={<ProcessIcon />}
                  expanded={stepsExpanded}
                  onToggle={() => setStepsExpanded(!stepsExpanded)}
                >
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside">
                    <li>Keep dApp information up to date</li>
                    <li>Add high-quality images and descriptions</li>
                    <li>Set competitive subscription pricing</li>
                    <li>Monitor analytics regularly</li>
                    <li>Engage with users and gather feedback</li>
                  </ul>
                </CollapsibleSection>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

