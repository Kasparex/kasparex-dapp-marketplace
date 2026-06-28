import { KxBadge } from '@/components/ui/KxBadge';

/** Community-created Chronicles content badge (Kasparex standard). */
export function ChroniclesCommunityBadge({ className = '' }: { className?: string }) {
  return (
    <KxBadge variant="amber" className={className}>
      Community
    </KxBadge>
  );
}
