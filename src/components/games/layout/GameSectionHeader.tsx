'use client';

import { FieldHint } from '@/components/ui/FieldHint';

export function GameSectionHeader(props: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full bg-emerald-500" />
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-tight inline-flex items-center gap-2">
          {props.title}
          {props.hint ? <FieldHint text={props.hint} /> : null}
        </h2>
      </div>
      {props.right ? <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500">{props.right}</div> : null}
    </div>
  );
}

