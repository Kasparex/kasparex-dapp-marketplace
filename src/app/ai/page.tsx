'use client';

import { useMemo, useState } from 'react';
import { AiPageShell } from '@/components/ai/AiPageShell';
import { AiHeader } from '@/components/ai/AiHeader';
import { AiAgentGrid } from '@/components/ai/AiAgentGrid';
import { AiRoadmapSteps } from '@/components/ai/AiRoadmapSteps';
import { AiSectionPlaceholder } from '@/components/ai/AiSectionPlaceholder';
import { FilterBar } from '@/components/FilterBar';
import { PLACEHOLDER_AI_AGENTS, filterAgentsByTab } from '@/lib/ai/agents';
import { AI_LISTING_TABS } from '@/lib/ai/tabs';
import type { AiHubSection, AiListingTab } from '@/lib/ai/types';

export default function KasparexAiPage() {
  const [activeSection, setActiveSection] = useState<AiHubSection>('agents');
  const [activeTab, setActiveTab] = useState<AiListingTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = useMemo(
    () => filterAgentsByTab(PLACEHOLDER_AI_AGENTS, activeTab, searchQuery),
    [activeTab, searchQuery],
  );

  const showAgentListing = activeSection === 'agents';

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
  };

  return (
    <AiPageShell sidebar={{ activeSection, onSectionChange: setActiveSection }}>
      <AiHeader />

      {showAgentListing ? (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">AI agents</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} in catalog (layout preview)
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center gap-1 p-1 k-control-group w-full overflow-x-auto flex-nowrap">
              {AI_LISTING_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8] shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <FilterBar
              search={{
                value: searchQuery,
                onChange: setSearchQuery,
                placeholder: 'Search agents, templates, workflows...',
              }}
              onReset={handleResetFilters}
            />
          </div>

          <AiAgentGrid agents={filteredAgents} />
          <AiRoadmapSteps onOpenSection={setActiveSection} />
        </>
      ) : (
        <AiSectionPlaceholder section={activeSection as Exclude<AiHubSection, 'agents' | 'marketplace' | 'documentation'>} />
      )}
    </AiPageShell>
  );
}
