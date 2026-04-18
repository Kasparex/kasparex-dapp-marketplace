'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarCategories, type CategoryItem } from '@/components/sidebar/SidebarCategories';
import type { ProtocolHubBucket } from '@/lib/protocolsHub';

const BUCKET_ORDER: ProtocolHubBucket[] = [
  'protocol',
  'tool',
  'use-case',
  'documentation',
  'implementation',
];

const BUCKET_LABEL: Record<ProtocolHubBucket, string> = {
  protocol: 'Protocols & record types',
  tool: 'Tools',
  'use-case': 'Use cases',
  documentation: 'Documentation',
  implementation: 'Implementations',
};

function BookIcon() {
  return (
    <svg className="k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg className="k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg className="k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8-4 8 4M4 7v10l8 4 8-4V7M4 7l8 4 8-4" />
    </svg>
  );
}

function bucketIcon(id: ProtocolHubBucket) {
  switch (id) {
    case 'protocol':
      return <LayersIcon />;
    case 'tool':
      return <WrenchIcon />;
    case 'use-case':
      return <BulbIcon />;
    case 'documentation':
      return <BookIcon />;
    case 'implementation':
      return <CodeIcon />;
    default:
      return <LayersIcon />;
  }
}

export function ProtocolsSidebar({
  selectedBuckets,
  onBucketsChange,
  suite,
  onSuiteChange,
  counts,
  onResetFilters,
}: {
  selectedBuckets: ProtocolHubBucket[];
  onBucketsChange: (next: ProtocolHubBucket[]) => void;
  suite: 'all' | 'kpx';
  onSuiteChange: (suite: 'all' | 'kpx') => void;
  counts: Record<ProtocolHubBucket, number>;
  onResetFilters: () => void;
}) {
  const pathname = usePathname();
  const backHref = pathname?.startsWith('/protocols/') ? '/protocols' : '/dapps';
  const backLabel = pathname?.startsWith('/protocols/') ? 'Back to Protocols' : 'Back to dApps';

  const bucketItems: CategoryItem[] = BUCKET_ORDER.map((id) => ({
    id,
    label: BUCKET_LABEL[id],
    count: counts[id],
    icon: bucketIcon(id),
  }));

  const suiteItems: CategoryItem[] = [
    { id: 'all', label: 'All suites', count: undefined, icon: <LayersIcon /> },
    { id: 'kpx', label: 'kpx suite', count: undefined, icon: <CodeIcon /> },
  ];

  const handleBucketToggle = (id: string) => {
    const b = id as ProtocolHubBucket;
    const has = selectedBuckets.includes(b);
    const next = has ? selectedBuckets.filter((x) => x !== b) : [...selectedBuckets, b];
    onBucketsChange(next);
  };

  const handleSuiteSelect = (id: string) => {
    onSuiteChange(id === 'kpx' ? 'kpx' : 'all');
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="protocols"
      header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />}
    >
      <div className="mb-8 space-y-2">
        <Link href="/protocols/kpx-tools" className="k-control-btn w-full">
          Post identity update
        </Link>
        <Link href="/knowledge-base" className="k-control-btn w-full">
          Knowledge Base
        </Link>
        <Link href="/dapps" className="k-control-btn w-full">
          dApps marketplace
        </Link>
      </div>

      <SidebarCategories
        title="Content type"
        items={bucketItems}
        selectedIds={selectedBuckets}
        onSelect={handleBucketToggle}
        multi
      />

      <SidebarCategories
        title="Suite"
        items={suiteItems}
        selectedIds={suite === 'kpx' ? 'kpx' : 'all'}
        onSelect={handleSuiteSelect}
        multi={false}
        className="mt-6"
      />

      <button type="button" onClick={onResetFilters} className="mt-6 w-full k-control-btn">
        Reset filters
      </button>
    </UnifiedSidebar>
  );
}
