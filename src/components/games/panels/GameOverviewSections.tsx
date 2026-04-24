'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

function normalizeLore(raw: string): string {
  // Convert obvious sentence-run text into paragraph-ish blocks.
  // Keep existing newlines if present.
  const t = raw.replace(/\r\n/g, '\n').trim();
  if (!t) return '';
  return t;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function splitSentences(text: string): string[] {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return [];
  // Reasonable heuristic; avoids over-splitting on abbreviations by requiring a space after punctuation.
  return t.split(/(?<=[.!?])\s+/g).map((s) => s.trim()).filter(Boolean);
}

function chunkSentences(sentences: string[], perParagraph = 2): string[] {
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    out.push(sentences.slice(i, i + perParagraph).join(' '));
  }
  return out;
}

function splitLoreIntoBlocks(raw: string): Array<{ type: 'heading' | 'p'; text: string }> {
  const t = normalizeLore(raw);
  if (!t) return [];

  // If author already inserted blank lines, respect them as paragraphs.
  const hasParas = /\n\s*\n/.test(t);
  if (hasParas) {
    return t
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({ type: 'p' as const, text: p }));
  }

  // Otherwise, try to promote ALL-CAPS markers into headings.
  // Example patterns seen in Diamond Veins: "THE DISCOVERY", "KREX DIAMONDS", "YOUR ROLE", "THE DEPTHS"
  const parts: Array<{ type: 'heading' | 'p'; text: string }> = [];
  const re = /\s([A-Z][A-Z0-9’'\- ]{6,})\s/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const marker = (m[1] ?? '').trim();
    const start = m.index;
    const before = t.slice(lastIndex, start).trim();
    if (before) parts.push({ type: 'p', text: before });
    parts.push({ type: 'heading', text: toTitleCase(marker) });
    lastIndex = re.lastIndex;
  }
  const rest = t.slice(lastIndex).trim();
  if (rest) parts.push({ type: 'p', text: rest });

  // Fallback: if we failed to find headings, keep as single paragraph.
  if (parts.length === 1 && parts[0]?.type === 'p') return parts;
  // Expand large paragraphs into multiple readable paragraphs (2 sentences each).
  const expanded: Array<{ type: 'heading' | 'p'; text: string }> = [];
  for (const p of parts) {
    if (p.type === 'heading') {
      expanded.push(p);
      continue;
    }
    const sents = splitSentences(p.text);
    if (sents.length <= 2) {
      expanded.push({ type: 'p', text: p.text.trim() });
      continue;
    }
    for (const para of chunkSentences(sents, 2)) expanded.push({ type: 'p', text: para });
  }
  return expanded.length ? expanded : [{ type: 'p', text: t }];
}

export function GameOverviewSections(props: {
  gameName: string;
  description?: string;
  loreStory?: string;
  flow?: string[];
  featuredImage?: string;
}) {
  const flow = props.flow ?? [];
  const loreBlocks = props.loreStory ? splitLoreIntoBlocks(props.loreStory) : [];
  return (
    <div className="space-y-6">
      <GamePanelCard title={props.gameName} hint={props.description?.trim() ? props.description : undefined}>
        {props.featuredImage ? (
          <div className="mb-5 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.featuredImage} alt={props.gameName} className="aspect-video w-full object-cover" />
          </div>
        ) : null}
        {loreBlocks.length > 0 ? (
          <article className="prose prose-zinc max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:my-4 prose-headings:tracking-tight">
            {loreBlocks.map((b, idx) =>
              b.type === 'heading' ? (
                <h3 key={`${b.type}-${idx}`} className="mt-8 mb-2 text-base font-black tracking-tight">
                  {b.text}
                </h3>
              ) : (
                <p key={`${b.type}-${idx}`}>{b.text}</p>
              )
            )}
          </article>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.description?.trim() ? props.description : '—'}</p>
        )}
      </GamePanelCard>

      <GamePanelCard title="Game flow" hint="Core loop at a glance.">
        {flow.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            {flow.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">—</p>
        )}
      </GamePanelCard>

      <GamePanelCard title="Game info" hint="Links and mechanics.">
        <ul className="space-y-0">
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Game</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{props.gameName}</span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rewards</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Claim later via Rewards &amp; Points</span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Network</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kaspa (L1) + Kasplex (L2)</span>
          </li>
        </ul>
      </GamePanelCard>
    </div>
  );
}

