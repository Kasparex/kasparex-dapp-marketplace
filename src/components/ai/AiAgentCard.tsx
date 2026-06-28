'use client';

import type { AiAgent } from '@/lib/ai/types';
import { formatAgentUsage } from '@/lib/ai/agents';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';

const CATEGORY_LABELS: Record<AiAgent['category'], string> = {
  'content-creation': 'Content Creation',
  productivity: 'Productivity',
  research: 'Research',
  finance: 'Finance',
  lifestyle: 'Lifestyle',
  utilities: 'Utilities',
};

const TOKEN_VARIANT: Record<AiAgent['token'], 'cyan' | 'emerald' | 'violet'> = {
  KAS: 'cyan',
  KREX: 'emerald',
  ARIA: 'violet',
};

function AgentIcon({ category }: { category: AiAgent['category'] }) {
  const props = {
    className: 'w-8 h-8 text-cyan-600 dark:text-cyan-400',
    fill: 'none' as const,
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  };
  switch (category) {
    case 'research':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'content-creation':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      );
    case 'productivity':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'finance':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
  }
}

export function AiAgentCard({ agent }: { agent: AiAgent }) {
  const isSoon = agent.status === 'soon';
  const isOnline = agent.status === 'online';

  return (
    <KxListingCard accent="ai" disabled={isSoon} className={isSoon ? 'opacity-80' : undefined}>
      <KxListingCardMedia aspectClass="aspect-[16/10]">
        <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
          <AgentIcon category={agent.category} />
        </div>
        {isSoon ? (
          <KxBadge variant="violet-solid" className="absolute top-3 right-3 tracking-wider">
            Soon
          </KxBadge>
        ) : null}
        {isOnline ? (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        ) : null}
        {agent.programmabilityReady ? (
          <KxBadge variant="cyan" className="absolute bottom-3 left-3">
            L1 ready
          </KxBadge>
        ) : null}
      </KxListingCardMedia>

      <KxListingCardBody comfortable>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-zinc-900 dark:text-zinc-100">{agent.name}</h3>
            <p className="text-xs font-medium text-zinc-500">{CATEGORY_LABELS[agent.category]}</p>
          </div>
          <KxBadge variant={TOKEN_VARIANT[agent.token]}>{agent.token}</KxBadge>
        </div>

        <p className="mb-4 line-clamp-2 kx-body-sm">{agent.description}</p>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            by <span className="font-semibold text-zinc-700 dark:text-zinc-300">{agent.creator}</span>
          </p>
          {!isSoon ? (
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatAgentUsage(agent.usageCount)}</span>
              <span className="flex items-center gap-0.5">
                <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {agent.rating} ({agent.reviewCount})
              </span>
            </div>
          ) : (
            <KxBadge variant="violet">Coming soon</KxBadge>
          )}
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
