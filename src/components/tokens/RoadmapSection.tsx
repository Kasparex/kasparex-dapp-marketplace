/**
 * Roadmap Section
 * Displays token roadmap timeline
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

interface RoadmapSectionProps {
  token: Token;
}

export function RoadmapSection({ token }: RoadmapSectionProps) {
  const roadmap = token.roadmap || [];

  if (roadmap.length === 0) {
    return null;
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'upcoming':
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <section id="roadmap" className="scroll-mt-28 space-y-6 border-b border-zinc-200 py-10 dark:border-zinc-800">
      <DAppSectionHeader title="Roadmap" />

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

        <div className="space-y-6">
          {roadmap.map((event, index) => (
            <div key={index} className="relative pl-12">
              {/* Timeline dot */}
              <div
                className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 ${
                  event.status === 'completed'
                    ? 'bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500'
                    : event.status === 'in-progress'
                      ? 'bg-blue-500 border-blue-600 dark:bg-blue-400 dark:border-blue-500'
                      : 'bg-zinc-400 border-zinc-500 dark:bg-zinc-500 dark:border-zinc-400'
                }`}
              />

              {/* Event card */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {event.title}
                    </h3>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {event.date}
                    </div>
                  </div>
                  {event.status && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {event.status.replace('-', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-zinc-700 dark:text-zinc-300">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
