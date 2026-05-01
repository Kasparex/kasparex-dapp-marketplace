'use client';

import type { ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { KASPPAREX_TOOLTIP_SURFACE_CLASS } from '@/components/ui/Tooltip';

export function GameTooltipProvider({ children }: { children: React.ReactNode }) {
  return <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>;
}

export type GameTooltipProps = {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Bold header (pairs with description). */
  title?: string;
  /** Supporting copy under the title. */
  description?: ReactNode;
  /** Legacy single block when title/description are omitted. */
  content?: ReactNode | string;
};

export function GameTooltip(props: GameTooltipProps) {
  const { title, description, content, children, side = 'top' } = props;

  let body: ReactNode;
  if (title != null && description !== undefined && description !== null) {
    body = (
      <div className="space-y-2">
        <p className="font-semibold">{title}</p>
        <div className="text-xs opacity-90">{description}</div>
      </div>
    );
  } else {
    body = <div className="text-xs leading-relaxed opacity-95">{content}</div>;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className={`${KASPPAREX_TOOLTIP_SURFACE_CLASS} z-[100] max-w-xs`}
        >
          {body}
          <Tooltip.Arrow className="fill-zinc-100 dark:fill-zinc-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
