import { KxBadge } from '@/components/ui/KxBadge';
import { chronicleTagBadgeVariant } from '@/lib/chronicles/chronicleTagBadge';

/** Colorful tag badges for Chronicles listing cards. */
export function ChronicleCardTagBadges({
  tags,
  max = 3,
}: {
  tags: string[];
  max?: number;
}) {
  if (!tags.length) return null;
  return (
    <>
      {tags.slice(0, max).map((t) => (
        <KxBadge key={t} variant={chronicleTagBadgeVariant(t)}>
          {t}
        </KxBadge>
      ))}
    </>
  );
}
