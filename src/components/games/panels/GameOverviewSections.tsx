'use client';

import type { ReactNode } from 'react';
import { KX_PREMIUM_MODULE_CARD } from '@/lib/hub/shellTokens';
import { KX_PANEL_LABEL, KX_PROSE, KX_PROSE_LIST, KX_PROSE_LIST_ITEM, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';

function normalizeLore(raw: string): string {
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
  return t
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
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

  const hasParas = /\n\s*\n/.test(t);
  if (hasParas) {
    return t
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({ type: 'p' as const, text: p }));
  }

  const parts: Array<{ type: 'heading' | 'p'; text: string }> = [];
  const re = /(^|[\s\n])([A-Z][A-Z0-9’'\- ]{6,})(?=\s)/gm;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const prefix = m[1] ?? '';
    const marker = (m[2] ?? '').trim();
    const markerStart = m.index + prefix.length;
    const before = t.slice(lastIndex, markerStart).trim();
    if (before) parts.push({ type: 'p', text: before });
    parts.push({ type: 'heading', text: toTitleCase(marker) });
    lastIndex = markerStart + marker.length;
  }
  const rest = t.slice(lastIndex).trim();
  if (rest) parts.push({ type: 'p', text: rest });

  if (parts.length === 1 && parts[0]?.type === 'p') return parts;
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

/** Small uppercase title kicker above Overview headings (Chronicles / Hub style). */
export const GAME_OVERVIEW_KICKER = `${KX_PANEL_LABEL} mb-2 block`;

export const GAME_OVERVIEW_SUBTITLE =
  'mt-2 mb-6 text-base font-medium leading-7 text-zinc-500 dark:text-zinc-400';

/** Chronicles-style section heading for game Overview articles. */
export const GAME_OVERVIEW_H2 =
  'text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug';

export const GAME_OVERVIEW_H3 =
  'text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-12 mb-2 tracking-tight border-b border-zinc-200 dark:border-zinc-800 pb-3 leading-snug';

export function GameOverviewTitleBlock(props: {
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Use h2 for page hero title, h3 for in-article sections. */
  as?: 'h2' | 'h3';
  className?: string;
  /** Compact title for light boxed panels (no large top margin / border). */
  compact?: boolean;
}) {
  const Tag = props.as ?? 'h2';
  const titleCls = props.compact
    ? 'text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug'
    : Tag === 'h2'
      ? GAME_OVERVIEW_H2
      : GAME_OVERVIEW_H3;
  const wrapCls =
    props.className ??
    (props.compact ? 'mb-1' : Tag === 'h2' ? 'mb-6' : 'mt-12 mb-4 first:mt-0');
  return (
    <header className={wrapCls}>
      {props.kicker?.trim() ? <span className={GAME_OVERVIEW_KICKER}>{props.kicker.trim()}</span> : null}
      <Tag className={titleCls}>{props.title}</Tag>
      {props.subtitle?.trim() ? (
        <p className={props.compact ? 'mt-1 text-sm text-zinc-500 dark:text-zinc-400' : GAME_OVERVIEW_SUBTITLE}>
          {props.subtitle.trim()}
        </p>
      ) : null}
    </header>
  );
}

/** Amber dashed tip box (same Hub premium-module styling). */
export function GameOverviewTip(props: { title?: string; children: ReactNode }) {
  return (
    <aside className={`${KX_PREMIUM_MODULE_CARD} my-8`}>
      {props.title?.trim() ? (
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">
          {props.title.trim()}
        </p>
      ) : (
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">Quick tip</p>
      )}
      <div className="text-base leading-7 text-amber-950/90 dark:text-amber-50/90">{props.children}</div>
    </aside>
  );
}

/**
 * Shared game Overview body: Chronicles Hub article typography (open prose, no featured hero).
 * Game flow / Game info stay in light boxed panels only.
 */
export function GameOverviewSections(props: {
  gameName: string;
  /** Uppercase kicker above the main title. */
  kicker?: string;
  /** Short line under the main title. */
  subtitle?: string;
  description?: string;
  loreStory?: string;
  flow?: string[];
  tips?: Array<{ title?: string; body: string }>;
  /** @deprecated Featured image lives on the Game header; ignored in Overview. */
  featuredImage?: string;
}) {
  const flow = props.flow ?? [];
  const loreBlocks = props.loreStory ? splitLoreIntoBlocks(props.loreStory) : [];
  const tips = props.tips ?? [];

  return (
    <div className="space-y-10">
      <article className={KX_PROSE}>
        <GameOverviewTitleBlock
          as="h2"
          kicker={props.kicker ?? 'Game guide'}
          title={props.gameName}
          subtitle={props.subtitle}
        />
        {props.description?.trim() ? <p className={KX_PROSE_PARAGRAPH}>{props.description.trim()}</p> : null}

        {tips[0] ? (
          <GameOverviewTip title={tips[0].title}>{tips[0].body}</GameOverviewTip>
        ) : null}

        {loreBlocks.length > 0 ? (
          loreBlocks.map((b, idx) =>
            b.type === 'heading' ? (
              <GameOverviewTitleBlock key={`${b.type}-${idx}`} as="h3" kicker="Lore" title={b.text} />
            ) : (
              <p key={`${b.type}-${idx}`} className={KX_PROSE_PARAGRAPH}>
                {b.text}
              </p>
            ),
          )
        ) : !props.description?.trim() ? (
          <p className={KX_PROSE_PARAGRAPH}>Not available.</p>
        ) : null}

        {tips.slice(1).map((tip, i) => (
          <GameOverviewTip key={`tip-${i}`} title={tip.title}>
            {tip.body}
          </GameOverviewTip>
        ))}
      </article>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-6">
        <GameOverviewTitleBlock
          as="h3"
          compact
          kicker="Operations"
          title="Game flow"
          subtitle="Core loop at a glance."
        />
        {flow.length > 0 ? (
          <ul className={`mt-4 list-disc pl-5 ${KX_PROSE_LIST}`}>
            {flow.map((s) => (
              <li key={s} className={KX_PROSE_LIST_ITEM}>
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`mt-4 ${KX_PROSE_PARAGRAPH}`}>Not available.</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-6">
        <GameOverviewTitleBlock
          as="h3"
          compact
          kicker="Details"
          title="Game info"
          subtitle="Links and mechanics."
        />
        <ul className="mt-4 space-y-0">
          <li className="flex items-center justify-between border-b border-zinc-200/80 py-3 dark:border-zinc-800">
            <span className="text-base text-zinc-600 dark:text-zinc-400">Game</span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{props.gameName}</span>
          </li>
          <li className="flex items-center justify-between border-b border-zinc-200/80 py-3 dark:border-zinc-800">
            <span className="text-base text-zinc-600 dark:text-zinc-400">Rewards</span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Claim later via Rewards &amp; Points
            </span>
          </li>
          <li className="flex items-center justify-between py-3">
            <span className="text-base text-zinc-600 dark:text-zinc-400">Network</span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Kaspa (L1) + Kasplex (L2)</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
