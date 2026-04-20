'use client';

import { FieldHint } from '@/components/ui/FieldHint';

export function SectionHeader(props: { title: string; hint?: string; right?: React.ReactNode; accentClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full ${props.accentClassName ?? 'bg-[#02abb8]'}`} />
        <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight inline-flex items-center gap-2">
          {props.title}
          {props.hint ? <FieldHint text={props.hint} /> : null}
        </h2>
      </div>
      {props.right ? <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500">{props.right}</div> : null}
    </div>
  );
}

