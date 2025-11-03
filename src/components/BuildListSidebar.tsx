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
        className="w-full flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-2 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
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
        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
          href="/"
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
          Back to Categories
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
          <div className="p-4 lg:p-6">
            {/* Back to Categories Button */}
            <Link
              href="/"
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
              Back to Categories
            </Link>

            {/* Page Title */}
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              {title}
            </h2>

            {/* Collapsible Sections */}
            <CollapsibleSection
              title="Overview"
              icon={<DescriptionIcon />}
              expanded={overviewExpanded}
              onToggle={() => setOverviewExpanded(!overviewExpanded)}
            >
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                Overview section content will be available here.
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="Requirements"
              icon={<UtilityIcon />}
              expanded={requirementsExpanded}
              onToggle={() => setRequirementsExpanded(!requirementsExpanded)}
            >
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                Requirements section content will be available here.
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="Steps"
              icon={<ProcessIcon />}
              expanded={stepsExpanded}
              onToggle={() => setStepsExpanded(!stepsExpanded)}
            >
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                Steps section content will be available here.
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="Guidelines"
              icon={<BenefitsIcon />}
              expanded={guidelinesExpanded}
              onToggle={() => setGuidelinesExpanded(!guidelinesExpanded)}
            >
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                Guidelines section content will be available here.
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="Resources"
              icon={<DeveloperIcon />}
              expanded={resourcesExpanded}
              onToggle={() => setResourcesExpanded(!resourcesExpanded)}
            >
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                Resources section content will be available here.
              </p>
            </CollapsibleSection>
          </div>
        </div>
      </aside>
    </>
  );
}

