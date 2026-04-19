'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { KASPPAREX_TOOLTIP_SURFACE_CLASS } from '@/components/ui/Tooltip';

export function GameTooltipProvider({ children }: { children: React.ReactNode }) {
  return <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>;
}

export function GameTooltip({
  content,
  children,
  side = 'top',
}: {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className={`${KASPPAREX_TOOLTIP_SURFACE_CLASS} z-[100] text-xs leading-relaxed`}
        >
          {content}
          <Tooltip.Arrow className="fill-zinc-100 dark:fill-zinc-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
