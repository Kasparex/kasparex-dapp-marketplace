'use client';

import { FieldHint } from '@/components/ui/FieldHint';
import { KX_SECTION_HEADER_MARGIN } from '@/lib/ui/kxLayout';

/** Section title with Hub tilt bar (uses --hub-accent; same pattern as Chronicles / dApps). */
export function GameSectionHeader(props: { title: string; hint?: string; right?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${KX_SECTION_HEADER_MARGIN} ${props.className ?? ''}`.trim()}
    >
      <div className="flex items-center gap-3">
        <div className="hub-tilt-bar-sm h-5 w-1 shrink-0 -skew-y-12 rounded-full" aria-hidden="true" />
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold leading-tight text-zinc-700 dark:text-zinc-200">
          {props.title}
          {props.hint ? <FieldHint text={props.hint} /> : null}
        </h2>
      </div>
      {props.right ? <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500">{props.right}</div> : null}
    </div>
  );
}
