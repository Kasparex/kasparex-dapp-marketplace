'use client';

import { usePathname } from 'next/navigation';
import { Category, categories } from '@/lib/categories';
import type { FilterState, DAppStatus } from '@/lib/dapps';
import { CategoriesIcon, StatusIcon, NetworkIcon } from '@/components/icons/SectionIcons';
import { StatusIndicatorDot, getStatusTypeFromString } from './dapps/StatusIndicatorDot';
import { UnifiedSidebar } from './UnifiedSidebar';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarNavItem } from './sidebar/SidebarNavItem';
import { SidebarCategories } from './sidebar/SidebarCategories';

interface SidebarProps {
  categories: Category[];
  onCategoryChange: (categories: Category[]) => void;
  filters: Omit<FilterState, 'category'>;
  onStatusChange: (status: DAppStatus[]) => void;
  onDeveloperChange: (developers: string[]) => void;
  onNetworkChange: (networks: string[]) => void;
  counts: Record<string, number>;
  onResetFilters: () => void;
}

const statusOptions: { value: DAppStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Mainnet', label: 'Mainnet' },
  { value: 'Testnet', label: 'Testnet' },
  { value: 'Suspended', label: 'Suspended' },
];

const networkOptions: { label: string; logo?: string }[] = [
  { label: 'All' },
  { label: 'Kasplex Mainnet', logo: '/img/logos/kasplex.png' },
  { label: 'Kasplex Testnet', logo: '/img/logos/kasplex.png' },
  { label: 'Igra Testnet', logo: '/img/logos/igra.png' },
  { label: 'Igra Mainnet', logo: '/img/logos/igra.png' },
  { label: 'vProgs', logo: '/img/logos/kaspa.png' },
];

function CategoryIcon({ id, className = '' }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' };
  switch (id) {
    case 'all': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'tracker': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'general': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'minting': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'defi': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'games': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 11-6 0 3 3 0 016 0zm6 5a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11 20.9l-6-6M4.5 12.5l5 5" /></svg>;
    case 'promotion': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A1.76 1.76 0 015 15.066V15c0 .115.022.23.064.338a.98.98 0 00.936.662H9c.552 0 1 .448 1 1s-.448 1-1 1H7.618a2 2 0 01-1.789-1.106l-.53-.1.53.1zm14.11-6.191A1.76 1.76 0 0021 6.096V6c0-.115-.022-.23-.064-.338a.98.98 0 00-.936-.662H15c-.552 0-1-.448-1-1s.448-1 1-1h1.382a2 2 0 001.789-1.106l.53.1-.53-.1z" /></svg>;
    case 'subscription': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    case 'dao': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case 'tools': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'collabs': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'airdrops': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
    case 'payment': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  }
}

const GlobeIcon = () => (
  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

export function Sidebar({
  categories: selectedCategories,
  onCategoryChange,
  filters,
  onStatusChange,
  onDeveloperChange: _onDeveloperChange,
  onNetworkChange,
  counts,
  onResetFilters,
}: SidebarProps) {
  const pathname = usePathname();

  const handleCategoryToggle = (id: string) => {
    const catId = id as Category;
    const found = categories.find((c) => c.id === catId);
    const next = selectedCategories.includes(catId)
      ? selectedCategories.filter((c) => c !== catId)
      : found ? [...selectedCategories, found.id] : selectedCategories;
    onCategoryChange(next);
  };

  const handleStatusToggle = (status: DAppStatus | 'all') => {
    const current = filters.status || [];
    const next = current.includes(status as DAppStatus)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onStatusChange(next.filter((s): s is DAppStatus => s !== 'all'));
  };

  const handleNetworkToggle = (label: string) => {
    const value = label === 'All' ? 'all' : label;
    const current = filters.network || [];
    const next = current.includes(value)
      ? current.filter((n) => n !== value)
      : [...current, value];
    onNetworkChange(next.filter((n) => n !== 'all'));
  };

  const categoryItems = categories.map((c) => ({
    id: c.id,
    label: c.name,
    count: counts[c.id] ?? 0,
    icon: <CategoryIcon id={c.id} />,
  }));

  const statusItems = statusOptions.map((opt) => ({
    id: opt.value,
    label: opt.label,
    icon: opt.value !== 'all' ? <StatusIndicatorDot statusType={getStatusTypeFromString(opt.value)} size="sm" /> : undefined,
  }));

  const networkItems = networkOptions.map((opt) => {
    const value = opt.label === 'All' ? 'all' : opt.label;
    return {
      id: value,
      label: opt.label,
      icon: <GlobeIcon />,
    };
  });

  const backToMarketplace = pathname.startsWith('/dapps');
  const backLabel = backToMarketplace ? 'Back to dApps' : 'Back to Hub';

  return (
    <UnifiedSidebar
      storageKeyPrefix="dapps"
      header={(onHide) => (
        <SidebarHeader
          backToMarketplace={backToMarketplace}
          backHref={backToMarketplace ? undefined : '/hub'}
          backLabel={backLabel}
          onHide={onHide}
        />
      )}
    >
      <SidebarCategories
        title="Categories"
        items={categoryItems}
        selectedIds={selectedCategories}
        onSelect={handleCategoryToggle}
        multi
      />

      <SidebarCategories
        title="Status"
        items={statusItems}
        selectedIds={filters.status || []}
        onSelect={(id) => handleStatusToggle(id as DAppStatus | 'all')}
        multi={true}
      />

      <SidebarCategories
        title="Network"
        items={networkItems}
        selectedIds={filters.network || []}
        onSelect={(id) => {
          const opt = networkOptions.find((o) => (o.label === 'All' ? 'all' : o.label) === id);
          if (opt) handleNetworkToggle(opt.label);
        }}
        multi={true}
      />

      <button type="button" onClick={onResetFilters} className="w-full mt-4 k-control-btn">
        Reset Filters
      </button>
    </UnifiedSidebar>
  );
}
