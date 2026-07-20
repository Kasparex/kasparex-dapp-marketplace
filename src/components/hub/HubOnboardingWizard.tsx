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
    eyebrow: 'Welcome',
    title: 'Welcome to Kasparex',
    body: 'Kasparex is a place where you can discover everything built on Kaspa.\n\nYou\'ll find apps, games, creators, videos, AI tools, tokens, rewards, and much more.\n\nThink of it as an app store, social platform, and crypto hub combined into one.\n\nIt brings together Web3 and familiar everyday web experiences, so blockchain feels simple instead of scary.',
    tip: 'You don\'t need a wallet to explore. Connect one only when you want to interact.',
  },
  {
    eyebrow: 'What is Kaspa?',
    title: 'The network behind everything',
    body: 'Kaspa is a cryptocurrency network, just like Bitcoin or Ethereum.\n\nThe difference is that Kaspa uses a newer technology called BlockDAG. That makes it much faster while staying secure and decentralized.\n\nKasparex is built on top of Kaspa, just like apps are built on top of an operating system.\n\nEverything inside Kasparex ultimately runs on Kaspa.',
    tip: 'Kaspa is the foundation. Kasparex builds useful experiences on top of it.',
  },
  {
    eyebrow: 'What is KAS?',
    title: 'The coin that powers Kaspa',
    body: 'Every cryptocurrency network has its own main coin.\n\nOn Kaspa, that coin is KAS.\n\nWhenever you send money, swap tokens, mint NFTs, or use a blockchain application, a tiny amount of KAS pays the network fee.\n\nWithout KAS, nothing can happen on the network.',
    tip: 'Keep a little KAS in your wallet. Network fees are usually very small.',
  },
  {
    eyebrow: 'What is KREX?',
    title: 'Kasparex\'s own token',
    body: 'KREX is the official token of the Kasparex ecosystem.\n\nWhile KAS powers the Kaspa network, KREX powers the Kasparex experience.\n\nHolding KREX unlocks discounts, better rewards, premium features, and special perks across many Hub applications.\n\nAs Kasparex grows, KREX becomes useful in more places.',
    tip: 'KAS keeps the network running. KREX unlocks the ecosystem.',
    cta: { label: 'Open Tokens', href: '/tokens/krex' },
  },
  {
    eyebrow: 'Other tokens',
    title: 'Every project can have its own token',
    body: 'KREX isn\'t the only token you\'ll find.\n\nMany projects build their own tokens on Kaspa.\n\nSome are used in games.\nSome unlock premium features.\nSome give rewards.\nOthers power entire applications.\n\nEach token has its own purpose.',
    tip: 'Every token page explains what that token does and where you can use it.',
    cta: { label: 'Browse Tokens', href: '/tokens' },
  },
  {
    eyebrow: 'What is a wallet?',
    title: 'Your digital key',
    body: 'A crypto wallet is like your personal account.\n\nIt lets you own coins, collect rewards, sign in to apps, and prove that your assets belong to you.\n\nIt also lets you securely sign in to applications without usernames or passwords.\n\nOnly you control your wallet. Kasparex never has access to your funds.',
    tip: 'You\'ll only be asked to connect your wallet when it\'s actually needed.',
  },
  {
    eyebrow: 'Recommended wallets',
    title: 'Which wallet should I use?',
    body: 'For most users, we recommend KasWare or Kastle.\n\nBoth work great with Kaspa applications and are easy to get started with.\n\nSome Layer 2 applications may also ask you to connect an EVM wallet (like the ones used with Ethereum-style apps).\n\nKasparex supports both.',
    tip: 'Start with a Kaspa wallet. Add an EVM wallet only when you need one.',
  },
  {
    eyebrow: 'What is Layer 1?',
    title: 'Layer 1 explained',
    body: 'Layer 1 is the main Kaspa network.\n\nIt stores your coins, secures transactions, and protects the entire ecosystem.\n\nThink of it as the foundation of a building.\n\nEverything starts here.',
    tip: 'KAS always lives on Layer 1.',
  },
  {
    eyebrow: 'What is Layer 2?',
    title: 'Faster apps. More possibilities.',
    body: 'Layer 2 is built on top of Kaspa.\n\nIt allows developers to create advanced applications, smart contracts, DeFi, and many new experiences while still benefiting from Kaspa\'s security.\n\nNot every app needs Layer 2.\n\nOnly use it when an application asks you to.',
    tip: 'Layer 1 keeps everything secure. Layer 2 unlocks new features.',
  },
  {
    eyebrow: 'Web2 + Web3',
    title: 'Best of both worlds',
    body: 'Not everything needs blockchain.\n\nKasparex combines traditional websites with decentralized technology.\n\nSometimes you\'ll simply click a button.\nSometimes you\'ll sign a blockchain transaction.\n\nThe right tool is used for the right job.',
    tip: 'The goal isn\'t "more blockchain." The goal is a better experience.',
  },
  {
    eyebrow: 'Connecting',
    title: 'When do I connect my wallet?',
    body: 'Only when an application needs it.\n\nReading articles? No wallet.\nWatching videos? No wallet.\nBuying a token? Yes.\nClaiming rewards? Yes.\nPublishing content? Yes.',
    tip: 'You\'ll always know when your wallet is needed.',
  },
  {
    eyebrow: 'Getting tokens',
    title: 'Buying tokens is easy',
    body: 'The first thing you\'ll need is some KAS.\n\nYou can buy it on supported exchanges and send it to your Kaspa wallet.\n\nOnce you have KAS, you can swap it for KREX or other Kaspa ecosystem tokens whenever you want.\n\nIt\'s just like exchanging one currency for another.',
    tip: 'Always make sure you\'re using the Kaspa network before sending funds.',
    cta: { label: 'Buying Guide', href: '/rewards' },
  },
  {
    eyebrow: 'dApps',
    title: 'What is a dApp?',
    body: 'A dApp is simply an application connected to blockchain.\n\nJust like mobile apps solve different problems, every dApp inside Kasparex has its own purpose.\n\nSome help creators.\nSome help traders.\nSome are made for fun.',
    tip: 'Don\'t worry about the technology. Just use the app.',
    cta: { label: 'Explore dApps', href: '/dapps' },
  },
  {
    eyebrow: 'Using Kasparex',
    title: 'It\'s easier than you think',
    body: 'Open any project that interests you.\n\nIf it needs your wallet, simply connect it.\n\nThen use the app, play the game, support a creator, trade a token, or explore what\'s inside.\n\nEvery project works a little differently, but getting started is always simple.',
    tip: 'If you\'re unsure what to do next, every project includes helpful information.',
    cta: { label: 'Explore Projects', href: '/hub#hub-projects' },
  },
  {
    eyebrow: 'Rewards',
    title: 'Get rewarded for participating',
    body: 'The more you use Kasparex, the more you can earn.\n\nMany activities reward you with Hub Points, which help you unlock higher tiers, better bonuses, discounts, and future benefits.\n\nSimply using the ecosystem moves you forward.',
    tip: 'Holding KREX increases many rewards and unlocks extra perks.',
    cta: { label: 'Open Rewards', href: '/rewards' },
  },
  {
    eyebrow: 'Your profile',
    title: 'Your wallet becomes your identity',
    body: 'Your wallet can become your profile across the Hub.\n\nUse it to build your reputation, collect achievements, own digital assets, and access future features.\n\nEverything belongs to you.',
    tip: 'One wallet works across the entire ecosystem.',
    cta: { label: 'Open Profile Hub', href: '/u' },
  },
  {
    eyebrow: 'Security',
    title: 'Stay safe',
    body: 'Never share your recovery phrase.\n\nNever approve transactions you don\'t understand.\n\nAlways double-check websites before connecting your wallet.\n\nYour wallet is your responsibility.',
    tip: 'Kasparex will never ask for your recovery phrase.',
  },
  {
    eyebrow: 'Discover',
    title: 'Explore the ecosystem',
    body: 'Every section of Kasparex offers something different.\n\nDiscover creators.\nPlay games.\nRead blogs.\nUse AI.\nTrade tokens.\nMint NFTs.\nSupport communities.\n\nThere\'s always something new.',
    tip: 'You don\'t need to learn everything today.',
  },
  {
    eyebrow: 'Build',
    title: 'Create, don\'t just consume',
    body: 'Kasparex isn\'t only for users.\n\nIt\'s also for builders.\n\nLaunch your own project.\nPublish content.\nCreate communities.\nBuild applications.\n\nEverything starts with an idea.',
    tip: 'The ecosystem grows because of its community.',
  },
  {
    eyebrow: 'You\'re ready',
    title: 'Welcome aboard',
    body: 'You now know the basics.\n\nKaspa is the network.\nKAS is its native coin.\nKREX powers the Kasparex ecosystem.\n\nEverything else is waiting for you to explore.\n\nWelcome to the future of the Kaspa ecosystem.',
    tip: 'You can reopen this guide anytime from the sidebar.',
    cta: { label: 'Start Exploring', href: '/hub#hub-projects' },
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
  const progressPct = ((index + 1) / SLIDES.length) * 100;

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

      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800" aria-hidden>
        <div
          className="h-full bg-[var(--k-primary)] transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-5 py-6 sm:px-6 min-h-[320px] max-h-[min(58vh,420px)] overflow-y-auto flex flex-col">
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
            <p className="text-[13px] leading-relaxed text-cyan-950 dark:text-cyan-100 whitespace-pre-line">
              {slide.tip}
            </p>
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

      <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 px-5 py-4">
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
    </KxModalShell>
  );
}
