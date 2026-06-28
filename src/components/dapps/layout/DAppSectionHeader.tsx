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
          className="h-5 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-tight inline-flex items-center gap-2">
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
