'use client';

import * as Tooltip from '@radix-ui/react-tooltip';

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
          className="z-[100] max-w-xs rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-100 shadow-lg dark:bg-zinc-950 dark:text-zinc-100"
        >
          {content}
          <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-950" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
