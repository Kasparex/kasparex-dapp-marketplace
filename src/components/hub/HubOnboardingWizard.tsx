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
    body: 'Kasparex is a utility layer on Kaspa: apps, games, creators, media, AI tools, tokens, and rewards in one Hub. It mixes familiar web experiences with Kaspa-native actions, so you get real utility without jumping across a dozen disconnected sites.',
    tip: 'Browse freely. Connect a wallet only when you want to interact.',
  },
  {
    eyebrow: 'What is Kaspa?',
    title: 'The network behind everything',
    body: 'Kaspa is a proof-of-work cryptocurrency network in the same category as Bitcoin, but it is not a linear chain. It is a BlockDAG: parallel blocks can coexist and are ordered by consensus (GHOSTDAG), which is why confirmations feel fast while security stays decentralized. Kasparex runs on that foundation.',
    tip: 'Kaspa is the base network. Kasparex is the product layer built on it.',
  },
  {
    eyebrow: 'What is KAS?',
    title: 'The coin that powers Kaspa',
    body: 'KAS is Kaspa’s native coin. Network fees, transfers, swaps, and other on-network actions settle in KAS. If you want to move value or use Kaspa-native apps, you need a little KAS in your wallet.',
    tip: 'Fees are usually tiny. Still keep a small KAS balance ready.',
  },
  {
    eyebrow: 'What is KREX?',
    title: 'Kasparex’s own token',
    body: 'KREX is the official token of the Kasparex ecosystem. KAS powers the Kaspa network; KREX powers Hub utility: discounts, stronger rewards, premium features, and perks across apps as the ecosystem expands.',
    tip: 'KAS runs the network. KREX unlocks Kasparex.',
    cta: { label: 'Open Tokens', href: '/tokens/krex' },
  },
  {
    eyebrow: 'Other tokens',
    title: 'Projects ship their own tokens',
    body: 'Beyond KREX, many Kaspa projects issue their own tokens for games, premium access, rewards, or app logic. Each one has a defined job. Read the token page before you buy or use it.',
    tip: 'Token pages spell out utility, networks, and where it applies.',
    cta: { label: 'Browse Tokens', href: '/tokens' },
  },
  {
    eyebrow: 'What is a wallet?',
    title: 'Your keys, your control',
    body: 'A wallet holds your keys: it proves ownership, signs actions, and lets you use apps without a traditional username/password account. You control it. Kasparex never holds your funds or recovery phrase.',
    tip: 'Connection prompts appear only when an action needs signing.',
  },
  {
    eyebrow: 'Recommended wallets',
    title: 'KasWare, Kastle, and EVM when needed',
    body: 'For Kaspa L1, start with KasWare or Kastle. Some Layer 2 apps also ask for an EVM wallet. Kasparex supports both; add EVM only when a specific app requires it.',
    tip: 'Kaspa wallet first. EVM second, and only on demand.',
  },
  {
    eyebrow: 'What is Layer 1?',
    title: 'Kaspa L1: the foundation',
    body: 'Layer 1 is the Kaspa BlockDAG itself: where KAS lives, value settles, and security anchors the ecosystem. Most core holdings and transfers begin here.',
    tip: 'KAS lives on Layer 1.',
  },
  {
    eyebrow: 'What is Layer 2?',
    title: 'Extra capability on top of Kaspa',
    body: 'Layer 2s sit on Kaspa and enable richer app patterns (smart contracts, DeFi-style flows, and more) while still leaning on Kaspa’s security. Use L2 only when an app asks you to; not every product needs it.',
    tip: 'L1 anchors security. L2 expands what apps can do.',
  },
  {
    eyebrow: 'Web2 + Web3',
    title: 'Use the right tool for the job',
    body: 'Not every action needs a signed network transaction. Kasparex mixes normal web UX with Kaspa-native steps: sometimes you click through, sometimes you sign. The point is a better product, not crypto theater.',
    tip: 'Prefer clarity and usefulness over forcing on-network steps everywhere.',
  },
  {
    eyebrow: 'Connecting',
    title: 'When a wallet is required',
    body: 'Browse articles and media without connecting. Connect when you buy, swap, claim rewards, publish, or otherwise change state that must be signed.',
    tip: 'If an action needs your wallet, the UI will ask clearly.',
  },
  {
    eyebrow: 'Getting tokens',
    title: 'Start with KAS, then swap',
    body: 'Buy KAS on supported venues, withdraw to your Kaspa wallet, then swap into KREX or other ecosystem tokens when you need them. Treat it like exchanging currencies: verify the network before you send.',
    tip: 'Wrong network is the usual way funds get stuck. Double-check first.',
    cta: { label: 'Buying Guide', href: '/rewards' },
  },
  {
    eyebrow: 'dApps',
    title: 'What is a dApp?',
    body: 'A dApp is an application wired to Kaspa (and sometimes Layer 2). Inside Kasparex, each one has a concrete job: creator tools, trading, games, publishing, and more. Use the product; the network plumbing stays under the hood.',
    tip: 'Open the app, follow its flow, connect only when prompted.',
    cta: { label: 'Explore dApps', href: '/dapps' },
  },
  {
    eyebrow: 'Using Kasparex',
    title: 'A simple operating loop',
    body: 'Pick a project, connect if required, then do the thing: play, tip, list, swap, publish. Sidebars and docs on each page cover the next step when you need detail.',
    tip: 'Stuck? Check that project’s sidebar and help content first.',
    cta: { label: 'Explore Projects', href: '/hub#hub-projects' },
  },
  {
    eyebrow: 'Rewards',
    title: 'Participation compounds',
    body: 'Many Hub activities earn Hub Points toward tiers, bonuses, discounts, and future perks. Using the ecosystem is the main path forward; holding KREX often improves those rewards.',
    tip: 'KREX commonly boosts rewards and unlocks extra perks.',
    cta: { label: 'Open Rewards', href: '/rewards' },
  },
  {
    eyebrow: 'Your profile',
    title: 'Wallet as identity',
    body: 'Across the Hub, your wallet can act as your profile key: reputation, assets, and access travel with you. You keep ownership; the Hub reads what you choose to connect.',
    tip: 'One identity model across Kasparex surfaces.',
    cta: { label: 'Open Profile Hub', href: '/u' },
  },
  {
    eyebrow: 'Security',
    title: 'Non-negotiables',
    body: 'Never share your recovery phrase. Never approve a transaction you do not understand. Verify URLs before connecting. Your keys are your responsibility.',
    tip: 'Kasparex will never ask for your recovery phrase.',
  },
  {
    eyebrow: 'Discover',
    title: 'What you can explore',
    body: 'Creators, games, blogs, AI, tokens, NFTs, communities: each Hub section is a different entry point. You do not need to master every surface on day one.',
    tip: 'Start with one project that matches what you already want to do.',
  },
  {
    eyebrow: 'Build',
    title: 'Create inside the ecosystem',
    body: 'Kasparex is for builders as well as users: launch projects, publish, form communities, ship apps. Growth comes from people who create, not only from people who browse.',
    tip: 'Ideas become products when the community ships them.',
  },
  {
    eyebrow: 'You\'re ready',
    title: 'You have the map',
    body: 'Kaspa is the BlockDAG network. KAS is its native coin. KREX powers Kasparex utility. The rest is exploration: open a project and move.',
    tip: 'Reopen this guide anytime from the sidebar.',
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
