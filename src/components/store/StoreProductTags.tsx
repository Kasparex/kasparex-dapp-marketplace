'use client';

import { KxTagChip } from '@/components/ui/KxTagChip';

export function StoreProductTags({
  tags,
  className = '',
  interactive = false,
  selectedTags = [],
  onToggle,
}: {
  tags: string[];
  className?: string;
  interactive?: boolean;
  selectedTags?: string[];
  onToggle?: (tag: string) => void;
}) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {tags.map((tag) =>
        interactive && onToggle ? (
          <KxTagChip
            key={tag}
            label={tag}
            selected={selectedTags.includes(tag)}
            onClick={() => onToggle(tag)}
          />
        ) : (
          <KxTagChip key={tag} label={tag} />
        ),
      )}
    </div>
  );
}
