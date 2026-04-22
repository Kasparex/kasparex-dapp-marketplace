'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { GamePayment } from '@/components/games/GamePayment';
import { KrexBoosterCard } from '@/components/games/boosters/KrexBoosterCard';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useKrexBoosters } from '@/hooks/useKrexBoosters';
import { RewardsPreview } from '@/components/games/modules/RewardsPreview';

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'play', label: 'Play' },
  { id: 'boosters', label: 'Boosters' },
  { id: 'comments', label: 'Comments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type Question = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
};

type Level = {
  id: string;
  title: string;
  theme: string;
  questions: Question[];
};

function buildLevels(): Level[] {
  return [
    {
      id: 'L1',
      title: 'The Heart of Kasparex',
      theme: 'Kasparex, Krex, the first breach',
      questions: [
        { id: 'L1Q1', prompt: 'Where does Krex operate from in the chronicles?', options: ['Vector’s Garage', 'Kasparex database center', 'Null Gang hideout', 'The Treasury Vault'], answerIndex: 1 },
        { id: 'L1Q2', prompt: 'Which faction attempts an infiltration during the early story?', options: ['Null Gang', 'KrexPrime Council', 'Aurora Syndicate', 'DAG Miners Union'], answerIndex: 0 },
        { id: 'L1Q3', prompt: 'KREX is described as…', options: ['A mining machine', 'A city district', 'A token tied to powers/perks', 'A fixed-rate stablecoin'], answerIndex: 2 },
        { id: 'L1Q4', prompt: 'Two allies summoned by Krex include…', options: ['Tessa & Vector', 'ARIA & KrexPrime', 'Sarah & Torq', 'Axel & Aria'], answerIndex: 0 },
        { id: 'L1Q5', prompt: 'Diamond Veins is connected to the same world as…', options: ['Krex’s Cipher Vaults', 'Kasparex Chronicles', 'Both', 'Neither'], answerIndex: 2 },
      ],
    },
    {
      id: 'L2',
      title: 'Null Gang Signals',
      theme: 'Interference, deception, corrupted traces',
      questions: [
        { id: 'L2Q1', prompt: 'Null Gang is known for…', options: ['Launching NFTs', 'Dismantling small crypto projects', 'Selling hardware', 'Publishing magazines'], answerIndex: 1 },
        { id: 'L2Q2', prompt: 'A breach is first detected by…', options: ['Random user report', 'Krex’s systems', 'Vector’s drone', 'A mirror node broadcast'], answerIndex: 1 },
        { id: 'L2Q3', prompt: 'A “cipher run” theme fits best with…', options: ['Cooking', 'Racing', 'Decoding / puzzles', 'Gardening'], answerIndex: 2 },
        { id: 'L2Q4', prompt: 'A safe first response to intrusion is to…', options: ['Ignore it', 'Lock down and verify signals', 'Post on socials', 'Delete the database'], answerIndex: 1 },
        { id: 'L2Q5', prompt: 'In Kasparex games, payments should be…', options: ['Non-verifiable', 'Idempotent + verified', 'Manual only', 'Randomized'], answerIndex: 1 },
      ],
    },
    {
      id: 'L3',
      title: 'Vector’s Toolbox',
      theme: 'Engineering, hacks, systems thinking',
      questions: [
        { id: 'L3Q1', prompt: 'Vector is best described as…', options: ['A master hacker', 'A cartoon mascot', 'A miner foreman', 'A protocol lawyer'], answerIndex: 0 },
        { id: 'L3Q2', prompt: 'In Diamond Veins, boosts are bought in…', options: ['Vector’s Garage', 'Kaspa Blocks Shop', 'Cipher Vault lobby', 'Krex’s Court'], answerIndex: 0 },
        { id: 'L3Q3', prompt: 'A sustainable reward system avoids…', options: ['Idempotency', 'Hard caps', 'Infinite free minting', 'Verification'], answerIndex: 2 },
        { id: 'L3Q4', prompt: 'A “multiplier” is usually applied to…', options: ['Score / rewards', 'Screen brightness', 'Network latency', 'Font size'], answerIndex: 0 },
        { id: 'L3Q5', prompt: 'Node-first means reads should…', options: ['Always hit origin', 'Prefer edge/mirror nodes', 'Require login', 'Be write-heavy'], answerIndex: 1 },
      ],
    },
    {
      id: 'L4',
      title: 'Tessa’s Stealth',
      theme: 'Stealth ops, careful choices',
      questions: [
        { id: 'L4Q1', prompt: 'Tessa is described as…', options: ['A brilliant coder', 'A gas station owner', 'A dungeon boss', 'A chain oracle'], answerIndex: 0 },
        { id: 'L4Q2', prompt: 'A good stealth strategy is…', options: ['Loud broadcasts', 'Minimal surface area', 'Random redirects', 'No logs ever'], answerIndex: 1 },
        { id: 'L4Q3', prompt: 'In a quiz, the simplest scoring is…', options: ['Correct answers', 'Random bonus', 'Time only', 'Wallet balance only'], answerIndex: 0 },
        { id: 'L4Q4', prompt: 'A “booster” should ideally be…', options: ['Pay-to-win forever', 'A small optional advantage', 'Mandatory', 'Hidden'], answerIndex: 1 },
        { id: 'L4Q5', prompt: 'KREX tier is best used as…', options: ['Identity proof', 'A multiplier / perk gate', 'A fiat onramp', 'A captcha'], answerIndex: 1 },
      ],
    },
    {
      id: 'L5',
      title: 'ARIA Fragments',
      theme: 'Memory shards, pattern matching',
      questions: [
        { id: 'L5Q1', prompt: 'Cipher Vaults vaults contain fragments of…', options: ['ARIA’s early memory', 'A newspaper', 'A random song', 'A mining drill manual'], answerIndex: 0 },
        { id: 'L5Q2', prompt: 'A rune-grid puzzle is closest to…', options: ['A logic grid', 'A paint app', 'A price chart', 'A phone dial'], answerIndex: 0 },
        { id: 'L5Q3', prompt: 'A “checkpoint” is best described as…', options: ['A recorded progress marker', 'A wallet address', 'A meme', 'A password reset'], answerIndex: 0 },
        { id: 'L5Q4', prompt: 'Diamonds in Kasparex are…', options: ['Cross-game utility currency', 'A stablecoin', 'A secret key', 'A GPU'], answerIndex: 0 },
        { id: 'L5Q5', prompt: 'Idempotency prevents…', options: ['Double minting', 'Wallet connect', 'Quizzes', 'Lore'], answerIndex: 0 },
      ],
    },
    {
      id: 'L6',
      title: 'Kaspaland Streets',
      theme: 'City lore, navigation',
      questions: [
        { id: 'L6Q1', prompt: 'Kaspaland is described as…', options: ['A neon-lit metropolis', 'A desert planet', 'A mountain village', 'An underwater lab'], answerIndex: 0 },
        { id: 'L6Q2', prompt: 'Kasparex is primarily a…', options: ['Database center / hub', 'Gym', 'Arcade', 'Hotel'], answerIndex: 0 },
        { id: 'L6Q3', prompt: 'A good game hub UX favors…', options: ['Many forks', 'Unified models', 'Hidden routes', 'Hard refresh loops'], answerIndex: 1 },
        { id: 'L6Q4', prompt: 'A simple sustainable game should be…', options: ['Write-heavy', 'Read-heavy', 'Always on-chain', 'Always serverless writes'], answerIndex: 1 },
        { id: 'L6Q5', prompt: 'Quizzes are best grouped by…', options: ['Randomness', 'Themes/levels', 'Wallet type', 'Timezone'], answerIndex: 1 },
      ],
    },
    {
      id: 'L7',
      title: 'The KREX Network',
      theme: 'Perks, tiers, coordination',
      questions: [
        { id: 'L7Q1', prompt: 'KREX investors are described as…', options: ['Elite beings with powers', 'Only miners', 'Only writers', 'Only traders'], answerIndex: 0 },
        { id: 'L7Q2', prompt: 'A tier system should be…', options: ['Opaque', 'Deterministic', 'Random daily', 'Admin-only visible'], answerIndex: 1 },
        { id: 'L7Q3', prompt: 'NFT perks are best as…', options: ['Small bonuses', 'Permanent domination', 'Hidden punishments', 'Mandatory entry'], answerIndex: 0 },
        { id: 'L7Q4', prompt: 'A unified deck should show…', options: ['Only ads', 'Rewards + Diamonds', 'Only images', 'Only errors'], answerIndex: 1 },
        { id: 'L7Q5', prompt: 'Node-first reads should be…', options: ['Slow', 'Cached', 'Unreliable', 'Always uncached'], answerIndex: 1 },
      ],
    },
    {
      id: 'L8',
      title: 'Veins & Vaults',
      theme: 'Cross-game links',
      questions: [
        { id: 'L8Q1', prompt: 'Diamond Veins produces…', options: ['Refinement points', 'Gas fees', 'Fiat', 'Passwords'], answerIndex: 0 },
        { id: 'L8Q2', prompt: 'Cipher Vaults can redeem…', options: ['Refinement points into tickets', 'NFTs into KAS', 'GRID into diamonds', 'KREX into XP'], answerIndex: 0 },
        { id: 'L8Q3', prompt: 'A good cross-game currency is…', options: ['Convertible 1:1 to cash', 'Utility-only with caps', 'Unbounded', 'Invisible'], answerIndex: 1 },
        { id: 'L8Q4', prompt: 'A “unified leaderboard” should use…', options: ['One schema', 'Many incompatible schemas', 'Only screenshots', 'Manual review'], answerIndex: 0 },
        { id: 'L8Q5', prompt: 'A run should have…', options: ['No ids', 'A session id', 'Only emojis', 'Only local time'], answerIndex: 1 },
      ],
    },
    {
      id: 'L9',
      title: 'Signals & Proof',
      theme: 'Verification patterns',
      questions: [
        { id: 'L9Q1', prompt: 'L1 payment verify checks…', options: ['Outputs + payload note', 'Only UI state', 'Only wallet name', 'Only screenshots'], answerIndex: 0 },
        { id: 'L9Q2', prompt: 'A verified payment can mint…', options: ['Diamonds cashback', 'Unlimited GRID', 'Nothing', 'A random NFT'], answerIndex: 0 },
        { id: 'L9Q3', prompt: 'A good booster is…', options: ['Optional', 'Mandatory', 'Secret', 'Unbounded'], answerIndex: 0 },
        { id: 'L9Q4', prompt: 'Sustainable scaling prefers…', options: ['Heavy DB writes', 'Read caching + idempotent writes', 'Always polling every 50ms', 'No caching'], answerIndex: 1 },
        { id: 'L9Q5', prompt: 'A deck endpoint is…', options: ['A read-only summary', 'A mint function', 'A delete function', 'A randomizer'], answerIndex: 0 },
      ],
    },
    {
      id: 'L10',
      title: 'Final Lock',
      theme: 'The last gate',
      questions: [
        { id: 'L10Q1', prompt: 'Krex is half-human, half…', options: ['Reptile', 'Robot', 'Bird', 'Wolf'], answerIndex: 0 },
        { id: 'L10Q2', prompt: 'Kasparex Games should be…', options: ['Unified + simple', 'Fragmented', 'Image-only', 'Spreadsheet-only'], answerIndex: 0 },
        { id: 'L10Q3', prompt: 'A good first leaderboard measures…', options: ['Score only', 'Randomness', 'Wallet size', 'Ad clicks'], answerIndex: 0 },
        { id: 'L10Q4', prompt: 'Best UX for payments is…', options: ['Verify + continue', 'Hard stop on transient lag', 'No receipts', 'No retry'], answerIndex: 0 },
        { id: 'L10Q5', prompt: 'The simplest win condition here is…', options: ['Answer correctly', 'Mine diamonds', 'Trade tokens', 'Write contracts'], answerIndex: 0 },
      ],
    },
  ];
}

export function KrexMysteryQuizDashboard(props: { featuredImage?: string; loreStory?: string; gameDescription?: string; gameName?: string; game: any }) {
  const { state: walletState } = useKaspaWallet();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult } = useKrexBoosters('kaspa-quiz');

  const levels = useMemo(() => buildLevels(), []);
  const [tab, setTab] = useState<TabId>('play');
  const [levelIndex, setLevelIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const tierMult = tier === 'Tier4' ? 1.25 : tier === 'Tier3' ? 1.15 : tier === 'Tier2' ? 1.1 : 1;
  const boosterMult = tierMult * (hasAnyNFT ? 1.1 : 1) * krexBoosterMult;

  const level = levels[levelIndex]!;
  const q = level.questions[questionIndex]!;

  return (
    <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col space-y-6 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-base dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">KREX Tier</span>
            <span className="rounded-full border border-zinc-300 bg-zinc-200 px-2 py-0.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              {tier}
            </span>
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">Multiplier</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">×{boosterMult.toFixed(2)}</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Earn on L1 · claim GRID on L2 via{' '}
            <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards &amp; Points
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">How it works</h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Start the case, clear 10 levels, and unlock deeper lore themes. Each level has 5 questions. Your score uses a simple multiplier from your KREX tier, NFT deck, and optional KREX booster.
              </p>
            </div>
          </div>
        )}

        {tab === 'boosters' && (
          <div className="space-y-6">
            <KrexBoosterCard gameId="kaspa-quiz" title="KREX booster" />
          </div>
        )}

        {tab === 'comments' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Community comments</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Discuss lore, report errors, and propose new questions. Wallet required to post.</p>
            </div>
            <CommentsSection articleId="game:kaspa-quiz" />
          </div>
        )}

        {tab === 'play' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                  Level {levelIndex + 1}/10 · Question {questionIndex + 1}/5
                </p>
                <h3 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">{level.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{level.theme}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Score</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{score}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Correct: {correct}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{q.prompt}</p>
              <div className="mt-4 grid gap-2">
                {q.options.map((opt, idx) => {
                  const active = selected === idx;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelected(idx)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                        active
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-zinc-900 dark:text-zinc-100'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Multiplier: ×{boosterMult.toFixed(2)}</p>
                <button
                  type="button"
                  disabled={selected == null}
                  className="k-cta-primary h-12 px-6 text-sm disabled:opacity-50 disabled:grayscale"
                  onClick={() => {
                    if (selected == null) return;
                    const ok = selected === q.answerIndex;
                    const delta = ok ? Math.floor(100 * boosterMult) : 0;
                    setScore((s) => s + delta);
                    setCorrect((c) => c + (ok ? 1 : 0));
                    setSelected(null);

                    if (questionIndex < 4) {
                      setQuestionIndex((i) => i + 1);
                      return;
                    }
                    if (levelIndex < 9) {
                      setLevelIndex((i) => i + 1);
                      setQuestionIndex(0);
                      return;
                    }
                    setFinished(true);
                  }}
                >
                  Submit
                </button>
              </div>

              {finished ? (
                <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Case closed. Final score: {score}.</p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
                    onClick={() => {
                      setLevelIndex(0);
                      setQuestionIndex(0);
                      setSelected(null);
                      setScore(0);
                      setCorrect(0);
                      setFinished(false);
                    }}
                  >
                    Play again
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-4">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50">
          {props.featuredImage ? (
            <div className="relative aspect-video w-full bg-zinc-200 dark:bg-zinc-800">
              <img src={props.featuredImage} alt={props.gameName ?? 'Mystery Quiz'} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="p-5">
            <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{props.gameName ?? 'Mystery Quiz'}</h2>
            {props.gameDescription ? (
              <p className="mb-4 border-l-2 border-emerald-500/40 bg-emerald-500/5 py-2 pl-3 pr-2 text-sm leading-relaxed text-zinc-600 dark:bg-emerald-500/10 dark:text-zinc-400">
                {props.gameDescription}
              </p>
            ) : null}

            {/* Rewards (simplified) under description */}
            <RewardsPreview variant="inline" showLink={false} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Entry</h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Pay once to begin the case run.</p>
          <GamePayment game={props.game} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="p-4">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">FAQ</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Boosters are optional. Rewards are unified across Kasparex via your wallet deck.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

