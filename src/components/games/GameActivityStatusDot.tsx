'use client';

export type GameActivityHealth = 'active' | 'exhausted' | 'inactive';

/** Shared green / orange / red activity indicator for Game Deck + primary gameplay tabs. */
export function GameActivityStatusDot({
  health,
  title,
}: {
  health: GameActivityHealth;
  title?: string;
}) {
  const color =
    health === 'active' ? 'bg-emerald-500' : health === 'exhausted' ? 'bg-orange-500' : 'bg-red-500';
  const label =
    health === 'active' ? 'Active' : health === 'exhausted' ? 'Needs attention' : 'Inactive';
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`}
      title={title ?? label}
      aria-label={title ?? label}
    />
  );
}
