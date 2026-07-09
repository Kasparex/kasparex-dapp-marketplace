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
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

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
          <HubListingTitleRow
            projectId="kasparex-ai"
            title="Available AI agents"
            count={filteredAgents.length}
            countLabel="agent"
            benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
          />

          <div className="mb-6 flex flex-col gap-4">
            <KxTabStrip
              value={activeTab}
              onChange={setActiveTab}
              options={AI_LISTING_TABS.map((tab) => ({
                value: tab.id,
                label: tab.label,
                title: tab.label,
              }))}
              ariaLabel="AI agent category"
              scrollable
            />

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
