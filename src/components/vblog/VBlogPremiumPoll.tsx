'use client';

import type { VBlogPollVote } from '@/lib/vblog/modules';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

type VBlogPremiumPollProps = {
  question: string;
  options: string[];
  votes: VBlogPollVote[];
  selectedOption: number;
  onSelectOption: (index: number) => void;
  onSubmitVote: () => void;
  canVote: boolean;
  hasVoted: boolean;
  userVoteIndex?: number;
  premiumUnlocked: boolean;
  isProcessing?: boolean;
};

export function VBlogPremiumPoll({
  question,
  options,
  votes,
  selectedOption,
  onSelectOption,
  onSubmitVote,
  canVote,
  hasVoted,
  userVoteIndex,
  premiumUnlocked,
  isProcessing = false,
}: VBlogPremiumPollProps) {
  const totalVotes = votes.length;
  const showResults = hasVoted;
  const activeVoteIndex = hasVoted ? userVoteIndex : selectedOption;

  const voteCounts = options.map((_, index) => votes.filter((v) => v.optionIndex === index).length);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50/80 to-white dark:from-zinc-900/60 dark:to-zinc-900 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <DAppSectionHeader title="Reader poll" className="mb-2" />
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {question}
          </p>
        </div>
        {totalVotes > 0 ? (
          <span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {totalVotes} vote{totalVotes === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {!premiumUnlocked ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Unlock premium content on the Article tab to participate in this poll.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-2.5" role={showResults ? 'list' : 'radiogroup'} aria-label={question}>
            {options.map((option, index) => {
              const count = voteCounts[index] ?? 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isSelected = activeVoteIndex === index;
              const isUserChoice = hasVoted && userVoteIndex === index;

              if (showResults) {
                return (
                  <div
                    key={`${option}-${index}`}
                    role="listitem"
                    className={`relative overflow-hidden rounded-xl border px-4 py-3 transition-colors ${
                      isUserChoice
                        ? 'border-[#02abb8]/50 bg-[#02abb8]/5 dark:bg-[#02abb8]/10'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{option}</span>
                      <span className="text-xs font-bold tabular-nums text-zinc-500 dark:text-zinc-400">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="absolute inset-y-0 left-0 bg-[#02abb8]/15 dark:bg-[#02abb8]/20 transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                    <p className="relative z-10 mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">
                      {count} vote{count === 1 ? '' : 's'}
                      {isUserChoice ? ' · Your choice' : ''}
                    </p>
                  </div>
                );
              }

              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!canVote || isProcessing}
                  onClick={() => onSelectOption(index)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all ${
                    isSelected
                      ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/15 ring-2 ring-[#02abb8]/25'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/50 hover:border-[#02abb8]/40 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? 'border-[#02abb8] bg-[#02abb8]'
                          : 'border-zinc-300 dark:border-zinc-600 bg-transparent'
                      }`}
                      aria-hidden
                    >
                      {isSelected ? (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      ) : null}
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{option}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {canVote ? (
            <button
              type="button"
              disabled={isProcessing || selectedOption < 0 || selectedOption >= options.length}
              onClick={onSubmitVote}
              className="mt-5 k-control-btn w-full sm:w-auto min-w-[10rem]"
            >
              {isProcessing ? 'Submitting...' : 'Submit vote'}
            </button>
          ) : hasVoted ? (
            <p className="mt-4 text-sm font-medium text-[#02abb8] dark:text-[#66dfe8]">
              Thanks for voting. Results update as more readers participate.
            </p>
          ) : (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Connect your wallet to submit a vote.
            </p>
          )}
        </>
      )}
    </div>
  );
}
