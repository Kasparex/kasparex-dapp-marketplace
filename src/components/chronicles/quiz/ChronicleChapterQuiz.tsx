'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { calculateDirectoryListingFeeKas, listingActionFeeLabel } from '@/lib/dapps/listingSubmissions';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { STORE_PAYMENT_CURRENCIES, type StorePaymentCurrency } from '@/lib/store/currencies';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_LABEL } from '@/lib/chronicles/typography';
import { CHRONICLE_QUIZ_ENTRY_FEE_KAS, CHRONICLE_QUIZ_QUESTION_COUNT } from '@/lib/chronicles/quiz/constants';
import { pickRandomChapterQuizQuestions } from '@/lib/chronicles/quiz/questions';
import type { ChronicleQuizQuestion } from '@/lib/chronicles/quiz/types';
import {
  getActiveQuizEntry,
  hasActiveQuizEntry,
  isChapterQuizCompleted,
  markChapterQuizCompleted,
  markQuizEntryUsed,
  recordQuizEntryPaid,
} from '@/lib/chronicles/quiz/localQuizState';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import type { ChronicleAccessMeta } from '@/lib/chronicles/types';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

type Phase = 'pay' | 'quiz' | 'result';

export function ChronicleChapterQuiz({
  chapterSlug,
  chapterTitle,
  access,
}: {
  chapterSlug: string;
  chapterTitle: string;
  access?: ChronicleAccessMeta;
}) {
  const { state } = useKaspaWallet();
  const { isUnlocked } = useChroniclesEntitlements(state.address);
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { payActionFee, isProcessing, error, setError } = useDAppListingPayment();

  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [phase, setPhase] = useState<Phase>('pay');
  const [questions, setQuestions] = useState<ChronicleQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ correct: number; total: number; passed: boolean } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const listingFee = useMemo(
    () => calculateDirectoryListingFeeKas(CHRONICLE_QUIZ_ENTRY_FEE_KAS, krexTier, nftStatus),
    [krexTier, nftStatus],
  );
  const feeLabel = listingActionFeeLabel(paymentCurrency, listingFee.effectiveKas);

  const contentLocked =
    access?.tier === 'premium' && access.contentId && !isUnlocked(access.contentId);

  const completed = isChapterQuizCompleted(state.address, chapterSlug);
  const hasEntry = hasActiveQuizEntry(state.address, chapterSlug);

  const syncPhase = useCallback(() => {
    if (completed) {
      setPhase('result');
      setResult({ correct: CHRONICLE_QUIZ_QUESTION_COUNT, total: CHRONICLE_QUIZ_QUESTION_COUNT, passed: true });
      return;
    }
    if (hasActiveQuizEntry(state.address, chapterSlug)) {
      setPhase('quiz');
      setQuestions((prev) => (prev.length ? prev : pickRandomChapterQuizQuestions(chapterSlug)));
      return;
    }
    setPhase('pay');
  }, [chapterSlug, completed, state.address]);

  useEffect(() => {
    syncPhase();
    const onUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('chronicles-quiz-updated', onUpdate);
    return () => window.removeEventListener('chronicles-quiz-updated', onUpdate);
  }, [syncPhase, refreshKey]);

  if (contentLocked) {
    return null;
  }

  const handlePay = async () => {
    setError(null);
    if (!state.isConnected || !state.address) {
      setError('Connect your Kaspa wallet to enter the quiz.');
      return;
    }
    try {
      const feeTxHash = await payActionFee(paymentCurrency, listingFee.effectiveKas);
      recordQuizEntryPaid(state.address, chapterSlug, feeTxHash);
      setQuestions(pickRandomChapterQuizQuestions(chapterSlug));
      setAnswers({});
      setPhase('quiz');
    } catch {
      /* payActionFee sets error */
    }
  };

  const handleSubmit = () => {
    if (!state.address || questions.length === 0) return;
    const entry = getActiveQuizEntry(state.address, chapterSlug);
    if (!entry) {
      setPhase('pay');
      return;
    }

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct += 1;
    }
    const passed = correct === questions.length;
    markQuizEntryUsed(state.address, chapterSlug);

    if (passed) {
      const txNorm = extractKaspaTransactionId(entry.txHash) ?? entry.txHash;
      appendHubActivityEarn({
        walletRaw: state.address,
        source: 'chronicles_quiz_complete',
        redeemableDelta: HUB_EARN_POINTS.chroniclesQuizComplete,
        idempotencyKey: `chronicles:quiz:${chapterSlug}:${txNorm}`,
        meta: { chapterSlug, chapterTitle },
      });
      markChapterQuizCompleted(state.address, chapterSlug);
    }

    setResult({ correct, total: questions.length, passed });
    setPhase('result');
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);

  return (
    <section className={`${CHRONICLES_PANEL} p-5 sm:p-6 mt-10`} aria-labelledby="chapter-quiz-heading">
      <p className={CHRONICLES_PANEL_LABEL}>Chapter quiz</p>
      <h2 id="chapter-quiz-heading" className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-2">
        Test your lore knowledge
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
        Answer {CHRONICLE_QUIZ_QUESTION_COUNT} questions from this chapter. One paid entry equals one attempt. Pass
        the quiz to earn {HUB_EARN_POINTS.chroniclesQuizComplete} Hub PTS.
      </p>

      {phase === 'pay' && !completed ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-start">
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Questions are drawn at random from official Kasparex chapter lore. Read the article above, then pay the
              entry fee to start your attempt.
            </p>
            {!state.isConnected ? (
              <p className="text-sm text-zinc-500">Connect your Kaspa wallet using the site header to continue.</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Entry fee
            </h3>
            <div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Pay with *</span>
              <KxSegmentToggle
                value={paymentCurrency}
                onChange={setPaymentCurrency}
                options={STORE_PAYMENT_CURRENCIES.map((cur) => ({ value: cur, label: cur }))}
                ariaLabel="Quiz entry currency"
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              One attempt:{' '}
              {listingFee.discountPercent > 0 ? (
                <span className="line-through text-zinc-400 mr-1">
                  {listingActionFeeLabel(paymentCurrency, listingFee.baseKas)}
                </span>
              ) : null}
              <span className="font-black text-[#02abb8]">{feeLabel}</span>
            </p>
            {listingFee.discountPercent > 0 ? (
              <p className="text-xs text-green-700 dark:text-green-400">
                KREX tier discount applied ({listingFee.discountPercent}% off)
              </p>
            ) : null}
            {error ? (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                {error}
              </div>
            ) : null}
            <button
              type="button"
              disabled={!state.isConnected || isProcessing}
              onClick={() => void handlePay()}
              className="w-full k-cta-primary !justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing…' : 'Pay and start quiz'}
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'quiz' && questions.length > 0 ? (
        <div className="space-y-6">
          <ol className="space-y-5">
            {questions.map((q, idx) => (
              <li key={q.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  {idx + 1}. {q.prompt}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const selected = answers[q.id] === optIdx;
                    return (
                      <button
                        key={`${q.id}-${optIdx}`}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          selected
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-zinc-900 dark:text-zinc-100'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-cyan-500/30'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className="k-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit answers
          </button>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-5 space-y-3">
          {result.passed || completed ? (
            <>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">Quiz passed!</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You answered {result.correct} of {result.total} correctly and earned{' '}
                {HUB_EARN_POINTS.chroniclesQuizComplete} Hub PTS.
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">Not quite.</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You answered {result.correct} of {result.total} correctly. Pay the entry fee again for another
                attempt.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setPhase('pay');
                }}
                className="k-control-btn mt-2"
              >
                Try again
              </button>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
