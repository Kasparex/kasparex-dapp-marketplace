'use client';

import { Tooltip } from '@/components/ui/Tooltip';

export type HealthLevel = 'healthy' | 'degraded' | 'down' | 'unknown';

function dotClass(level: HealthLevel): string {
  switch (level) {
    case 'healthy':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'down':
      return 'bg-red-500';
    case 'unknown':
    default:
      return 'bg-zinc-400 dark:bg-zinc-600';
  }
}

export function HealthDot(props: { level: HealthLevel; label: string; className?: string }) {
  return (
    <Tooltip content={props.label} side="top" align="center">
      <span
        className={[
          'inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900',
          dotClass(props.level),
          props.className ?? '',
        ].join(' ')}
        aria-label={props.label}
      />
    </Tooltip>
  );
}

export function healthFromUptimeHours(uptimeHours: number | null | undefined): { level: HealthLevel; label: string } {
  const u = typeof uptimeHours === 'number' ? uptimeHours : null;
  if (u == null) return { level: 'unknown', label: 'Unknown health (no uptime yet)' };
  if (u >= 1) return { level: 'healthy', label: `Healthy (uptime ${u.toFixed(1)}h)` };
  if (u >= 0.1) return { level: 'degraded', label: `Degraded (uptime ${u.toFixed(1)}h)` };
  return { level: 'down', label: `Unstable (uptime ${u.toFixed(1)}h)` };
}

