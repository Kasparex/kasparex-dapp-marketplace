'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { KxBadge } from '@/components/ui/KxBadge';

function BadgeList({ items, tagStyle }: { items: string[]; tagStyle?: boolean }) {
  if (items.length === 0) {
    return <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">None</span>;
  }
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {items.map((item) => (
        <KxBadge key={item} variant={tagStyle ? 'zinc' : 'emerald'}>
          {tagStyle ? `#${item.replace(/^#/, '')}` : item}
        </KxBadge>
      ))}
    </div>
  );
}

export function GameMetadataPanel(props: { categories?: string[]; tags?: string[] }) {
  const categories = props.categories ?? [];
  const tags = props.tags ?? [];
  const categoryCopy = categories.length > 0 ? categories.join(', ') : '';
  const tagCopy = tags.length > 0 ? tags.join(', ') : '';

  return (
    <GamePanelCard title="Metadata">
      <HubMetadataStatGrid
        gridClassName="grid grid-cols-1 items-stretch gap-3"
        stats={[
          {
            label: 'Categories',
            value: categoryCopy || 'None',
            hint: categories.length ? `${categories.length} listed` : undefined,
            copyable: categories.length > 0,
            tooltipTitle: 'Categories',
            tooltipDescription: 'Game categories used for Hub filters and discovery.',
            valueNode: <BadgeList items={categories} />,
          },
          {
            label: 'Tags',
            value: tagCopy || 'None',
            hint: tags.length ? `${tags.length} tags` : undefined,
            copyable: tags.length > 0,
            tooltipTitle: 'Tags',
            tooltipDescription: 'Freeform tags that describe this game listing.',
            valueNode: <BadgeList items={tags} tagStyle />,
          },
        ]}
      />
    </GamePanelCard>
  );
}
