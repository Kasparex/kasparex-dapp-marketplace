'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { useQuizToEarn, Question, UserAnswer } from '@/hooks/useQuizToEarn';
import { getContractAddress } from '@/lib/contracts/addresses';
import { RewardsDisplay } from './RewardsDisplay';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { hubNotify } from '@/lib/hub/notify';

export function QuizToEarnWidget() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | null>(null);

  const contractAddress = getContractAddress(chainId, 'QuizToEarn');
  const gridTokenAddress = getContractAddress(chainId, 'GRIDToken');

  const {
    questions,
    userAnswers,
    isLoading,
    error,
    submitAnswer,
    refreshQuestions,
    refreshUserAnswers,
    questionCount,
    defaultRewardAmount,
    getUserAnswer,
  } = useQuizToEarn();

  // Format contract address for display
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const contractExplorerUrl = contractAddress ? getExplorerUrl(contractAddress, chainId) : null;

  // Load user answer when question is selected
  useEffect(() => {
    if (selectedQuestion && isConnected && address) {
      const loadAnswer = async () => {
        const answer = await getUserAnswer(selectedQuestion.id);
        if (answer) {
          setCurrentAnswer(answer);
          setSelectedAnswerIndex(Number(answer.selectedAnswerIndex));
          setShowResult(true);
        } else {
          setCurrentAnswer(null);
          setSelectedAnswerIndex(null);
          setShowResult(false);
        }
      };
      loadAnswer();
    }
  }, [selectedQuestion, isConnected, address, getUserAnswer]);

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setSelectedAnswerIndex(null);
    setShowResult(false);
    setCurrentAnswer(null);
  };

  const handleSelectAnswer = (index: number) => {
    if (currentAnswer) {
      return; // Already answered
    }
    setSelectedAnswerIndex(index);
  };

  const handleSubmitAnswer = async () => {
    if (!contractAddress || contractAddress === '' || !contractAddress.startsWith('0x')) {
      hubNotify.warning(
        'Contract unavailable',
        'Quiz-to-Earn is not deployed on this network. Switch to Kasplex Testnet (Chain ID: 167012).',
      );
      return;
    }

    if (!selectedQuestion || selectedAnswerIndex === null) {
      hubNotify.warning('Select an answer', 'Choose an option before submitting.');
      return;
    }

    if (currentAnswer) {
      hubNotify.info('Already answered', 'You have already answered this question.');
      return;
    }

    try {
      await submitAnswer(selectedQuestion.id, BigInt(selectedAnswerIndex));
      // Wait a moment for the transaction to be mined
      setTimeout(async () => {
        await refreshUserAnswers();
        const answer = await getUserAnswer(selectedQuestion.id);
        if (answer) {
          setCurrentAnswer(answer);
          setShowResult(true);
        }
      }, 3000);
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Error is already handled by the hook
    }
  };

  const handleNextQuestion = () => {
    if (!selectedQuestion) return;
    
    const currentIndex = questions.findIndex(q => q.id === selectedQuestion.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < questions.length) {
      handleSelectQuestion(questions[nextIndex]);
    } else {
      // Go back to question list
      setSelectedQuestion(null);
      setSelectedAnswerIndex(null);
      setShowResult(false);
      setCurrentAnswer(null);
    }
  };

  // If no question selected, show question list
  if (!selectedQuestion) {
    return (
      <div className="p-6 space-y-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Quiz-to-Earn
          </h2>
          <p className="kx-body">
            Answer crypto and ecosystem questions to earn rewards! Each correct answer earns you GRID or token rewards.
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💰 Reward per correct answer: <span className="font-semibold">0.01 GRID tokens</span>
            <span className="text-xs ml-2 opacity-75">(Recommended: sustainable and scalable)</span>
          </p>
        </div>

        {contractAddress && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Contract:</span>
              {contractExplorerUrl ? (
                <a
                  href={contractExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#02abb8] hover:text-[#0199a3] hover:underline font-mono transition-colors"
                  title={contractAddress}
                >
                  {formatAddress(contractAddress)}
                </a>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                  {formatAddress(contractAddress)}
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!contractAddress && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              ⚠️ Quiz-to-Earn contract is not deployed on this network. Please switch to Kasplex Testnet (Chain ID: 167012).
            </p>
          </div>
        )}

        {!isConnected && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Please connect your wallet to participate in quizzes
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Available Questions {questionCount !== null && `(${questionCount.toString()})`}
          </h3>
          <button
            onClick={refreshQuestions}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {isLoading && questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400">
              No questions available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => {
              const userAnswer = userAnswers.get(question.id);
              const isAnswered = userAnswer !== undefined && userAnswer.timestamp > 0n;

              return (
                <div
                  key={question.id.toString()}
                  onClick={() => handleSelectQuestion(question)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isAnswered
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {question.category}
                        </span>
                        {isAnswered && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              userAnswer.isCorrect
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {userAnswer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        {question.questionText}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Reward: <span className="font-semibold">0.01 GRID tokens</span>
                      </p>
                    </div>
                    <div className="ml-4">
                      {isAnswered ? (
                        <span className="text-sm text-green-600 dark:text-green-400">✓ Answered</span>
                      ) : (
                        <span className="text-sm text-blue-600 dark:text-blue-400">→ Answer</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Rewards Section */}
        {isConnected && gridTokenAddress && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <RewardsDisplay
              gridTokenAddress={gridTokenAddress}
              className=""
            />
          </div>
        )}
      </div>
    );
  }

  // Show question detail and answer interface
  return (
    <div className="p-6 space-y-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedQuestion(null);
            setSelectedAnswerIndex(null);
            setShowResult(false);
            setCurrentAnswer(null);
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Questions
        </button>
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
          {selectedQuestion.category}
        </span>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {selectedQuestion.questionText}
        </h3>

        {!showResult && (
          <div className="space-y-3 mb-6">
            {selectedQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={isLoading || currentAnswer !== null}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  selectedAnswerIndex === index
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswerIndex === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {selectedAnswerIndex === index && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-zinc-900 dark:text-zinc-100">{option}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResult && currentAnswer && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border mb-4 ${
                currentAnswer.isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {currentAnswer.isCorrect ? (
                  <>
                    <span className="text-2xl">🎉</span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      Correct Answer!
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">❌</span>
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      Incorrect Answer
                    </span>
                  </>
                )}
              </div>
              <p className="kx-body">
                You selected: {selectedQuestion.options[Number(currentAnswer.selectedAnswerIndex)]}
              </p>
              {currentAnswer.isCorrect && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                  💰 You earned <span className="font-semibold">0.01 GRID tokens</span>! Your GRID balance will update automatically.
                </p>
              )}
            </div>

            <div className="space-y-2">
              {selectedQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    index === Number(currentAnswer.selectedAnswerIndex)
                      ? currentAnswer.isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : index === Number(selectedQuestion.options.length - 1) && !currentAnswer.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                        index === Number(currentAnswer.selectedAnswerIndex)
                          ? currentAnswer.isCorrect
                            ? 'bg-green-500'
                            : 'bg-red-500'
                          : index === Number(selectedQuestion.options.length - 1) && !currentAnswer.isCorrect
                          ? 'bg-green-500'
                          : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                    >
                      {index === Number(currentAnswer.selectedAnswerIndex) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                      {index === Number(selectedQuestion.options.length - 1) && !currentAnswer.isCorrect && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-zinc-900 dark:text-zinc-100">{option}</span>
                    {index === Number(selectedQuestion.options.length - 1) && !currentAnswer.isCorrect && (
                      <span className="ml-auto text-sm text-green-600 dark:text-green-400">Correct Answer</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showResult && (
          <button
            onClick={handleSubmitAnswer}
            disabled={isLoading || selectedAnswerIndex === null || currentAnswer !== null}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Submit Answer'}
          </button>
        )}

        {showResult && (
          <button
            onClick={handleNextQuestion}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {questions.findIndex(q => q.id === selectedQuestion.id) < questions.length - 1
              ? 'Next Question'
              : 'Back to Questions'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* My Rewards Section */}
      {isConnected && gridTokenAddress && (
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <RewardsDisplay
            gridTokenAddress={gridTokenAddress}
            className=""
          />
        </div>
      )}
    </div>
  );
}

