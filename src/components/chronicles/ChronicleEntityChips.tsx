import Link from 'next/link';

export function ChronicleEntityChips({
  title,
  links,
}: {
  title: string;
  links: { slug: string; label: string; href: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div className="mb-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.slug}
            href={l.href}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-cyan-500/10 hover:text-[#02abb8] border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
