'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KxModalShell } from '@/components/ui/KxModalShell';

type OnboardingSlide = {
  eyebrow: string;
  title: string;
  body: string;
  tip?: string;
  cta?: { label: string; href: string };
};

const SLIDES: OnboardingSlide[] = [
  {
    eyebrow: 'Start here',
    title: 'Welcome to Kasparex Hub',
    body: 'One place for Kaspa apps, media, games, tokens, and tools. Pick a project card. Connect a wallet when you need to act. That is the whole loop.',
    tip: 'You can browse everything without a wallet. Connect only when you spend, earn, or publish.',
  },
  {
    eyebrow: 'The network',
    title: 'Kaspa, in one line',
    body: 'Kaspa is a fast proof-of-work network built as a blockDAG. Blocks land often. Confirmations feel quick. It is the base layer Kasparex runs on.',
    tip: 'Think of Kaspa as the highway. Kasparex is the city built on top of it.',
  },
  {
    eyebrow: 'Main coin',
    title: 'KAS is the fuel',
    body: 'KAS is Kaspa’s native coin. You use it to pay fees, buy ads, tip creators, and power actions across Hub apps. No KAS, no on-chain moves.',
    tip: 'Keep a little KAS ready. Fees are usually tiny, but you still need some.',
  },
  {
    eyebrow: 'The brand token',
    title: 'KREX unlocks the Hub',
    body: 'KREX is Kasparex’s flagship token. Hold it for fee discounts, reward multipliers, tiers, and premium perks across dApps, Store, vBlog, and more.',
    tip: 'More KREX often means cheaper usage and stronger rewards.',
    cta: { label: 'Open Tokens', href: '/tokens/krex' },
  },
  {
    eyebrow: 'Other tokens',
    title: 'GRID and friends',
    body: 'GRID is the ecosystem reward token. Other listings can appear on Tokens as Utility-as-a-Service pages. Always check the token page for utilities and links.',
    tip: 'Start with KAS + KREX. Add GRID when you care about rewards.',
    cta: { label: 'Browse Tokens', href: '/tokens' },
  },
  {
    eyebrow: 'Where to buy',
    title: 'Get KAS and KREX',
    body: 'Buy KAS on major exchanges, then move it into a Kaspa wallet. Buy KREX on Kaspa DEXs (Zealous, KaspaCom, and others). Bridge only when an L2 app asks for it.',
    tip: 'Wrong network = stuck funds. Match L1 vs L2 before you swap.',
    cta: { label: 'Rewards buy guides', href: '/rewards' },
  },
  {
    eyebrow: 'Wallets',
    title: 'Connect once, use everywhere',
    body: 'Use a Kaspa wallet (KasWare / Kastle) for L1 actions. Use an EVM wallet when an L2 dApp asks for it. The Hub header wallet buttons cover both.',
    tip: 'Same identity idea across Hub: your address is your profile key.',
  },
  {
    eyebrow: 'How to use Hub',
    title: 'Four moves that matter',
    body: '1) Open a project from the grid.\n2) Connect the wallet that page needs.\n3) Do the action (list, play, tip, swap).\n4) Check Rewards for pts and perks.',
    tip: 'Stuck? Open that project’s sidebar. Most pages explain the next step there.',
    cta: { label: 'Explore projects', href: '/hub#hub-projects' },
  },
  {
    eyebrow: 'You are ready',
    title: 'Go build your path',
    body: 'Start with dApps or Tokens if you want utility. Try Games or Store for fun. Use Rewards to track what you earn. The Hub is meant to feel simple on purpose.',
    tip: 'Reopen this guide anytime from the sidebar.',
    cta: { label: 'Explore dApps', href: '/dapps' },
  },
];

export function HubOnboardingWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(SLIDES.length - 1, i + 1));

  const handleClose = () => {
    onClose();
    window.setTimeout(() => setIndex(0), 200);
  };

  return (
    <KxModalShell
      isOpen={isOpen}
      onClose={handleClose}
      panelClassName="max-w-lg"
      labelledBy="hub-onboarding-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--k-primary)]">
            Quick onboarding
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Slide {index + 1} of {SLIDES.length}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close onboarding"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-6 sm:px-6 min-h-[280px] flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2">
          {slide.eyebrow}
        </p>
        <h2
          id="hub-onboarding-title"
          className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-3"
        >
          {slide.title}
        </h2>
        <p className="text-sm sm:text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line flex-1">
          {slide.body}
        </p>

        {slide.tip ? (
          <div className="mt-5 rounded-xl border border-cyan-500/25 bg-cyan-500/8 dark:bg-cyan-950/25 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-200 mb-1">
              Tip
            </p>
            <p className="text-[13px] leading-relaxed text-cyan-950 dark:text-cyan-100">{slide.tip}</p>
          </div>
        ) : null}

        {slide.cta ? (
          <Link
            href={slide.cta.href}
            onClick={handleClose}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--k-primary)] hover:underline"
          >
            {slide.cta.label}
          </Link>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-1.5" aria-hidden>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? 'w-5 bg-[var(--k-primary)]'
                  : 'w-1.5 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="k-cta-secondary text-xs py-2 px-3.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            Back
          </button>
          {isLast ? (
            <button type="button" onClick={handleClose} className="k-cta-primary text-xs py-2 px-3.5">
              Got it
            </button>
          ) : (
            <button type="button" onClick={goNext} className="k-cta-primary text-xs py-2 px-3.5">
              Next
            </button>
          )}
        </div>
      </div>
    </KxModalShell>
  );
}
