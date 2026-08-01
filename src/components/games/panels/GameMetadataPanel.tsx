'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';

export function GameMetadataPanel(props: { categories?: string[]; tags?: string[] }) {
  const categories = props.categories ?? [];
  const tags = props.tags ?? [];
  const categoryValue = categories.length > 0 ? categories.join(', ') : 'None';
  const tagValue = tags.length > 0 ? tags.join(', ') : 'None';

  return (
    <GamePanelCard title="Metadata">
      <HubMetadataStatGrid
        stats={[
          {
            label: 'Categories',
            value: categoryValue,
            hint: categories.length ? `${categories.length} listed` : undefined,
            copyable: categories.length > 0,
            tooltipTitle: 'Categories',
            tooltipDescription: 'Game categories used for Hub filters and discovery.',
          },
          {
            label: 'Tags',
            value: tagValue,
            hint: tags.length ? `${tags.length} tags` : undefined,
            copyable: tags.length > 0,
            tooltipTitle: 'Tags',
            tooltipDescription: 'Freeform tags that describe this game listing.',
          },
        ]}
      />
    </GamePanelCard>
  );
}
