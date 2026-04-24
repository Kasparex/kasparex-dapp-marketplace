'use client';

export function GameFeaturedPanel(props: {
  featuredImage?: string;
  title: string;
  description?: string;
  loreStory?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50">
      {props.featuredImage ? (
        <div className="relative aspect-video w-full bg-zinc-200 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.featuredImage} alt={props.title} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="p-5">
        <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{props.title}</h2>
        {props.description ? (
          <p className="mb-4 border-l-2 border-emerald-500/40 bg-emerald-500/5 py-2 pl-3 pr-2 text-sm leading-relaxed text-zinc-600 dark:bg-emerald-500/10 dark:text-zinc-400">
            {props.description}
          </p>
        ) : null}
        {props.loreStory ? (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.loreStory}</p>
        ) : null}
      </div>
    </div>
  );
}

