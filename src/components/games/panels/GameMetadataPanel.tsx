'use client';

export function GameMetadataPanel(props: { categories?: string[]; tags?: string[] }) {
  const categories = props.categories ?? [];
  const tags = props.tags ?? [];
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-bold uppercase tracking-wider text-white">Metadata</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {c}
          </span>
        ))}
        {tags.map((t) => (
          <span key={t} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            {t}
          </span>
        ))}
        {categories.length === 0 && tags.length === 0 ? (
          <span className="text-xs text-zinc-300">No metadata available.</span>
        ) : null}
      </div>
    </div>
  );
}

