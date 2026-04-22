'use client';

import { Suspense, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GamePayment } from '@/components/games/GamePayment';
import { GameModulesBar } from '@/components/games/modules/GameModulesBar';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useKrexBoosters } from '@/hooks/useKrexBoosters';
import { KrexBoosterCard } from '@/components/games/boosters/KrexBoosterCard';

const KaspaL1WalletButton = dynamic(
  () => import('@/components/KaspaL1WalletButton').then((mod) => ({ default: mod.KaspaL1WalletButton })),
  { ssr: false }
);

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
  questions: Question[]; // exactly 5
};

function buildLevels(): Level[] {
  // Keep lightweight: static, deterministic, lore-inspired (can be swapped to real content later).
  return [
    {
      id: 'L1',
      title: 'The Heart of Kasparex',
      theme: 'Kasparex, Krex, the first breach',
      questions: [
        {
          id: 'L1Q1',
          prompt: 'Where does Krex operate from in the chronicles?',
          options: ['Vector’s Garage', 'Kasparex database center', 'Null Gang hideout', 'The Treasury Vault'],
          answerIndex: 1,
        },
        {
          id: 'L1Q2',
          prompt: 'Which faction attempts an infiltration during the early story?',
          options: ['Null Gang', 'KrexPrime Council', 'Aurora Syndicate', 'DAG Miners Union'],
          answerIndex: 0,
        },
        {
          id: 'L1Q3',
          prompt: 'KREX is described as…',
          options: ['A mining machine', 'A city district', 'A token tied to powers/perks', 'A fixed-rate stablecoin'],
          answerIndex: 2,
        },
        {
          id: 'L1Q4',
          prompt: 'Two allies summoned by Krex include…',
          options: ['Tessa & Vector', 'ARIA & KrexPrime', 'Sarah & Torq', 'Axel & Aria'],
          answerIndex: 0,
        },
        {
          id: 'L1Q5',
          prompt: 'Diamond Veins is connected to the same world as…',
          options: ['Krex’s Cipher Vaults', 'Kasparex Chronicles', 'Both', 'Neither'],
          answerIndex: 2,
        },
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

function QuizGame() {
  const { state: walletState } = useKaspaWallet();
  const game = getGameBySlugFromRegistry('kaspa-quiz');
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult } = useKrexBoosters('kaspa-quiz');

  const levels = useMemo(() => buildLevels(), []);
  const [levelIndex, setLevelIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const level = levels[levelIndex]!;
  const q = level.questions[questionIndex]!;

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const tierMult =
    tier === 'Tier4' ? 1.25 : tier === 'Tier3' ? 1.15 : tier === 'Tier2' ? 1.1 : 1;
  const boosterMult = tierMult * (hasAnyNFT ? 1.1 : 1) * krexBoosterMult;

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  if (!walletState.isConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
          <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100">{game.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base">{game.description}</p>
        <div className="[&_button]:h-14 [&_button]:px-8 [&_button]:text-base">
          <KaspaL1WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GameModulesBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Level {levelIndex + 1}/10
              </div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{level.title}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{level.theme}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Boosters</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                ×{boosterMult.toFixed(2)}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                KREX tier + NFT deck
              </div>
            </div>
          </div>

          {!finished ? (
            <>
              <div className="mb-4">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Question {questionIndex + 1}/5
                </div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{q.prompt}</div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, idx) => {
                  const isPicked = selected === idx;
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={[
                        'text-left px-4 py-3 rounded-xl border transition-colors',
                        isPicked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200',
                      ].join(' ')}
                      onClick={() => setSelected(idx)}
                    >
                      <div className="text-sm font-medium">{opt}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Score: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{score}</span>
                  <span className="mx-2">•</span>
                  Correct: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{correct}</span>
                </div>
                <button
                  type="button"
                  disabled={selected == null}
                  className="px-5 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#028a94] disabled:bg-zinc-400 text-white font-semibold transition-colors"
                  onClick={() => {
                    if (selected == null) return;
                    const ok = selected === q.answerIndex;
                    const delta = ok ? Math.floor(100 * boosterMult) : 0;
                    setScore((s) => s + delta);
                    setCorrect((c) => c + (ok ? 1 : 0));
                    setSelected(null);

                    const isLastQ = questionIndex === 4;
                    if (!isLastQ) {
                      setQuestionIndex((i) => i + 1);
                      return;
                    }
                    const isLastLevel = levelIndex === 9;
                    if (isLastLevel) {
                      setFinished(true);
                      return;
                    }
                    setLevelIndex((i) => i + 1);
                    setQuestionIndex(0);
                  }}
                >
                  Submit
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">Case closed</div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Final score: <span className="font-semibold">{score}</span> • Correct: <span className="font-semibold">{correct}</span>
              </div>
              <button
                type="button"
                className="mt-6 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
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
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Entry</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Pay once to begin the case run. (Verification + Diamonds cashback stays unified.)
            </div>
            <GamePayment game={game} />
          </div>

          <KrexBoosterCard gameId="kaspa-quiz" title="KREX booster" />
        </div>
      </div>
    </div>
  );
}

function PageInner() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
      </div>

      <Header />

      <main className="flex-1 relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="mb-6">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group text-base font-medium"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Link>
          </div>

          <div className="flex-1">
            <QuizGame />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function KrexChroniclesQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-base">
          Loading…
        </div>
      }
    >
      <PageInner />
    </Suspense>
  );
}

