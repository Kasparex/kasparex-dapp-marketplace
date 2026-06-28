'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { calculateDirectoryListingFeeKas, listingActionFeeLabel } from '@/lib/dapps/listingSubmissions';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxAlert } from '@/components/ui/KxAlert';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { STORE_PAYMENT_CURRENCIES, type StorePaymentCurrency } from '@/lib/store/currencies';
import { CHRONICLES_PANEL } from '@/lib/chronicles/typography';
import { KxCategoryKicker } from '@/components/ui/KxCategoryKicker';
import { refreshServerHubBalance } from '@/lib/rewards/serverHubBalanceCoordinator';
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
import { KxHubPtsBadge } from '@/components/ui/KxHubPtsBadge';
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

  const contentLocked = access?.tier === 'premium' && access.contentId && !isUnlocked(access.contentId);

  const completed = isChapterQuizCompleted(state.address, chapterSlug);

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
    const total = questions.length;
    markQuizEntryUsed(state.address, chapterSlug);

    if (passed) {
      const txNorm = extractKaspaTransactionId(entry.txHash) ?? entry.txHash;
      appendHubActivityEarn({
        walletRaw: state.address,
        source: 'chronicles_quiz_complete',
        redeemableDelta: HUB_EARN_POINTS.chroniclesQuizComplete,
        idempotencyKey: `chronicles:quiz:${chapterSlug}:${txNorm}`,
        meta: { chapterSlug, chapterTitle, txHash: txNorm },
      });
      markChapterQuizCompleted(state.address, chapterSlug);
      void fetch('/api/chronicles/quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: state.address,
          chapterSlug,
          txHash: entry.txHash,
          correct,
          total,
        }),
      })
        .then(() => refreshServerHubBalance())
        .catch(() => refreshServerHubBalance());
    }

    setResult({ correct, total, passed });
    setPhase('result');
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);
  const answeredCount = questions.filter((q) => answers[q.id] != null).length;

  return (
    <section
      id="chapter-quiz"
      className={`${CHRONICLES_PANEL} scroll-mt-24 p-5 sm:p-6 mt-10 relative`}
      aria-labelledby="chapter-quiz-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <KxCategoryKicker className="!mb-7">Chapter quiz</KxCategoryKicker>
          <h2 id="chapter-quiz-heading" className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Test your lore knowledge
          </h2>
        </div>
        <KxHubPtsBadge
          points={HUB_EARN_POINTS.chroniclesQuizComplete}
          title="Hub PTS reward for passing this quiz"
          className="shrink-0"
        />
      </div>
      <p className="kx-body">
        Answer {CHRONICLE_QUIZ_QUESTION_COUNT} questions from this chapter. One paid entry equals one attempt. Pass the
        quiz to earn {HUB_EARN_POINTS.chroniclesQuizComplete} Hub PTS.
      </p>

      {phase === 'pay' && !completed ? (
        <div className="mt-8 space-y-8">
          <div className="space-y-3">
            <p className="kx-body">
              Questions are drawn at random from official Kasparex chapter lore. Read the article above, then pay the
              entry fee to start your attempt.
            </p>
            {!state.isConnected ? (
              <KxAlert variant="info" title="Wallet required">
                Connect your Kaspa wallet using the site header to continue.
              </KxAlert>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-5 max-w-xl">
            <DAppSectionHeader title="Entry fee" className="mb-0" />
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
              <KxAlert variant="error" title="Payment failed">
                {error}
              </KxAlert>
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
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Question {Math.min(answeredCount + 1, questions.length)} of {questions.length}
            </p>
            <div className="h-1.5 flex-1 min-w-[120px] max-w-xs rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#02abb8] transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <ol className="space-y-5">
            {questions.map((q, idx) => (
              <li
                key={q.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 bg-white dark:bg-zinc-950"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 leading-relaxed">
                  <span className="text-[#02abb8] mr-2">{idx + 1}.</span>
                  {q.prompt}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const selected = answers[q.id] === optIdx;
                    return (
                      <button
                        key={`${q.id}-${optIdx}`}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                        className={`w-full text-left px-3.5 py-3 rounded-lg border text-sm transition-colors ${
                          selected
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-zinc-900 dark:text-zinc-100 font-medium'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-cyan-500/30 hover:bg-cyan-500/5'
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <button
              type="button"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="k-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit answers
            </button>
            {!allAnswered ? (
              <p className="text-xs text-zinc-500">
                {answeredCount} of {questions.length} answered
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div className="mt-8 space-y-5">
          {result.passed || completed ? (
            <>
              <KxAlert variant="success" title="Quiz completed successfully">
                You answered {result.correct} of {result.total} correctly. Great work on {chapterTitle}.
              </KxAlert>
              <KxAlert variant="reward" title={`Reward earned: ${HUB_EARN_POINTS.chroniclesQuizComplete} Hub PTS`}>
                Your Hub PTS balance will update shortly. This attempt is recorded for this chapter.
              </KxAlert>
            </>
          ) : (
            <>
              <KxAlert variant="error" title="Incorrect answers">
                You answered {result.correct} of {result.total} correctly. Review the chapter above and try again with a
                new paid entry.
              </KxAlert>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setQuestions([]);
                  setPhase('pay');
                }}
                className="k-control-btn"
              >
                Try again
              </button>
            </>
          )}

          {!result.passed && !completed ? (
            <ol className="space-y-3 pt-2">
              {questions.map((q, idx) => {
                const chosen = answers[q.id];
                const isCorrect = chosen === q.correctIndex;
                return (
                  <li
                    key={q.id}
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200'
                        : 'border-rose-500/30 bg-rose-500/5 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <span className="font-semibold">
                      {idx + 1}. {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    {!isCorrect ? (
                      <span className="block mt-1 text-xs opacity-90">
                        Correct answer: {q.options[q.correctIndex]}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
