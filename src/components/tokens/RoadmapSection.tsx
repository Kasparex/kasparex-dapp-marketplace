/**
 * Roadmap Section
 * Displays token roadmap timeline
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';

interface RoadmapSectionProps {
  token: Token;
}

export function RoadmapSection({ token }: RoadmapSectionProps) {
  const roadmap = token.roadmap || token.modulesConfig?.roadmap || [];
  const intro = token.modulesConfig?.roadmapIntro?.trim();
  const outro = token.modulesConfig?.roadmapOutro?.trim();

  if (roadmap.length === 0 && !intro && !outro) {
    return (
      <section id="roadmap" className="space-y-6">
        <DAppSectionHeader title="Roadmap" />
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No roadmap has been published for this token yet.</p>
        </div>
      </section>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'in-progress':
        return 'border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)]';
      case 'upcoming':
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <section id="roadmap" className="space-y-6">
      <DAppSectionHeader title="Roadmap" />

      {intro ? <KxRichTextContent html={intro} className="kx-prose" /> : null}

      {roadmap.length > 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

          <div className="space-y-6">
            {roadmap.map((event, index) => (
              <div key={index} className="relative pl-12">
                <div
                  className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 ${
                    event.status === 'completed'
                      ? 'bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500'
                      : event.status === 'in-progress'
                        ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent)]'
                        : 'bg-zinc-400 border-zinc-500 dark:bg-zinc-500 dark:border-zinc-400'
                  }`}
                />

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
                    {event.status ? (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status.replace('-', ' ')}
                      </span>
                    ) : null}
                  </div>
                  <KxRichTextContent html={event.description} className="kx-prose text-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {outro ? <KxRichTextContent html={outro} className="kx-prose" /> : null}
    </section>
  );
}
