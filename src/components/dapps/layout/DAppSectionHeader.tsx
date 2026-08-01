'use client';

import { FieldHint } from '@/components/ui/FieldHint';
import { KX_SECTION_HEADER_MARGIN } from '@/lib/ui/kxLayout';

export function DAppSectionHeader(props: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${KX_SECTION_HEADER_MARGIN} ${props.className ?? ''}`}>
      <div className="flex items-center gap-3">
        <div
          className="hub-tilt-bar-sm h-5 w-1 shrink-0 -skew-y-12 rounded-full"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight inline-flex items-center gap-2">
          {props.title}
          {props.hint ? <FieldHint text={props.hint} /> : null}
        </h2>
      </div>
      {props.right ? (
        <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500">{props.right}</div>
      ) : null}
    </div>
  );
}
