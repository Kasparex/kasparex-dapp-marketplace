'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { QUIZ_TO_EARN_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useSafeError } from './useSafeError';

export interface Question {
  id: bigint;
  questionText: string;
  options: string[];
  category: string;
  rewardAmount: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface UserAnswer {
  questionId: bigint;
  selectedAnswerIndex: bigint;
  isCorrect: boolean;
  timestamp: bigint;
  rewardClaimed: boolean;
}

interface UseQuizToEarnReturn {
  questions: Question[];
  userAnswers: Map<bigint, UserAnswer>;
  isLoading: boolean;
  error: string | null;
  submitAnswer: (questionId: bigint, selectedAnswerIndex: bigint) => Promise<void>;
  refreshQuestions: () => Promise<void>;
  refreshUserAnswers: () => Promise<void>;
  questionCount: bigint | null;
  defaultRewardAmount: bigint | null;
  getUserAnswer: (questionId: bigint) => Promise<UserAnswer | null>;
  getUserAnsweredQuestions: () => Promise<bigint[]>;
}

export function useQuizToEarn(): UseQuizToEarnReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<bigint, UserAnswer>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress(chainId, 'QuizToEarn');

  // Read contract state
  const { data: questionCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: QUIZ_TO_EARN_ABI,
    functionName: 'questionCount',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  const { data: defaultRewardAmount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: QUIZ_TO_EARN_ABI,
    functionName: 'defaultRewardAmount',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  // Write contract
  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    hash,
  });

  const safeWriteError = useSafeError(writeError);
  const safeTxError = useSafeError(txError);

  // Load questions
  const refreshQuestions = useCallback(async () => {
    if (!contractAddress || !publicClient || !isConnected) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get question count first
      const countResult = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: QUIZ_TO_EARN_ABI,
        functionName: 'questionCount',
      });

      // Properly handle unknown type from readContract
      let count: bigint;
      if (typeof countResult === 'bigint') {
        count = countResult;
      } else if (typeof countResult === 'number') {
        count = BigInt(countResult);
      } else if (typeof countResult === 'string') {
        count = BigInt(countResult);
      } else {
        // Fallback to 0 if type is unexpected
        count = 0n;
      }

      if (count === 0n) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      // Load questions in batches (50 at a time)
      const allQuestions: Question[] = [];
      const batchSize = 50n;
      let offset = 0n;

      while (offset < count) {
        try {
          const result = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: QUIZ_TO_EARN_ABI,
            functionName: 'getActiveQuestions',
            args: [offset, batchSize],
          });

          // Properly handle unknown type from readContract
          if (!Array.isArray(result) || result.length !== 5) {
            console.error('Invalid result format from getActiveQuestions');
            break;
          }

          const [ids, questionTexts, optionsArray, categories, rewardAmounts] = result as [
            bigint[],
            string[],
            string[][],
            string[],
            bigint[]
          ];

          for (let i = 0; i < ids.length; i++) {
            allQuestions.push({
              id: ids[i],
              questionText: questionTexts[i],
              options: optionsArray[i],
              category: categories[i],
              rewardAmount: rewardAmounts[i],
              isActive: true,
              createdAt: 0n, // Not returned by getActiveQuestions
            });
          }

          if (ids.length < Number(batchSize)) {
            break; // No more questions
          }

          offset += batchSize;
        } catch (err) {
          console.error('Error loading questions batch:', err);
          break;
        }
      }

      // Sort by ID (newest first)
      allQuestions.sort((a, b) => {
        if (a.id > b.id) return -1;
        if (a.id < b.id) return 1;
        return 0;
      });

      setQuestions(allQuestions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questions';
      setError(errorMessage);
      console.error('Error loading questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, publicClient, isConnected]);

  // Load user answers
  const refreshUserAnswers = useCallback(async () => {
    if (!contractAddress || !publicClient || !isConnected || !address) {
      return;
    }

    try {
      // Get list of answered question IDs
      const answeredIdsResult = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: QUIZ_TO_EARN_ABI,
        functionName: 'getUserAnsweredQuestions',
        args: [address],
      });

      // Properly handle unknown type from readContract
      if (!Array.isArray(answeredIdsResult)) {
        setUserAnswers(new Map());
        return;
      }

      const answeredIds = answeredIdsResult as bigint[];
      const answersMap = new Map<bigint, UserAnswer>();

      // Load each answer
      for (const questionId of answeredIds) {
        try {
          const answer = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: QUIZ_TO_EARN_ABI,
            functionName: 'getUserAnswer',
            args: [address, questionId],
          });

          answersMap.set(questionId, {
            questionId: answer.questionId,
            selectedAnswerIndex: answer.selectedAnswerIndex,
            isCorrect: answer.isCorrect,
            timestamp: answer.timestamp,
            rewardClaimed: answer.rewardClaimed,
          });
        } catch (err) {
          console.error(`Error loading answer for question ${questionId}:`, err);
        }
      }

      setUserAnswers(answersMap);
    } catch (err) {
      console.error('Error loading user answers:', err);
    }
  }, [contractAddress, publicClient, isConnected, address]);

  // Get user answer for a specific question
  const getUserAnswer = useCallback(async (questionId: bigint): Promise<UserAnswer | null> => {
    if (!contractAddress || !publicClient || !isConnected || !address) {
      return null;
    }

    try {
      const answer = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: QUIZ_TO_EARN_ABI,
        functionName: 'getUserAnswer',
        args: [address, questionId],
      });

      if (answer.timestamp === 0n) {
        return null; // Not answered yet
      }

      return {
        questionId: answer.questionId,
        selectedAnswerIndex: answer.selectedAnswerIndex,
        isCorrect: answer.isCorrect,
        timestamp: answer.timestamp,
        rewardClaimed: answer.rewardClaimed,
      };
    } catch (err) {
      console.error(`Error getting user answer for question ${questionId}:`, err);
      return null;
    }
  }, [contractAddress, publicClient, isConnected, address]);

  // Get user's answered question IDs
  const getUserAnsweredQuestions = useCallback(async (): Promise<bigint[]> => {
    if (!contractAddress || !publicClient || !isConnected || !address) {
      return [];
    }

    try {
      const answeredIdsResult = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: QUIZ_TO_EARN_ABI,
        functionName: 'getUserAnsweredQuestions',
        args: [address],
      });

      // Properly handle unknown type from readContract
      if (!Array.isArray(answeredIdsResult)) {
        return [];
      }

      return answeredIdsResult as bigint[];
    } catch (err) {
      console.error('Error getting user answered questions:', err);
      return [];
    }
  }, [contractAddress, publicClient, isConnected, address]);

  // Submit answer
  const submitAnswer = useCallback(async (questionId: bigint, selectedAnswerIndex: bigint) => {
    if (!contractAddress || !isConnected || !address) {
      setError('Wallet not connected or contract address missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: QUIZ_TO_EARN_ABI,
        functionName: 'submitAnswer',
        args: [questionId, selectedAnswerIndex],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [contractAddress, isConnected, address, writeContract]);

  // Update error state from transaction
  useEffect(() => {
    if (safeWriteError || safeTxError) {
      setError(safeWriteError || safeTxError || null);
    }
  }, [safeWriteError, safeTxError]);

  // Reset loading state on transaction confirmation or error
  useEffect(() => {
    if (isConfirmed) {
      setIsLoading(false);
      // Refresh questions and answers after successful submission
      setTimeout(() => {
        refreshQuestions();
        refreshUserAnswers();
      }, 2000);
    } else if (safeWriteError || safeTxError) {
      setIsLoading(false);
    }
  }, [isConfirmed, safeWriteError, safeTxError, refreshQuestions, refreshUserAnswers]);

  // Load questions on mount and when contract address changes
  useEffect(() => {
    if (contractAddress && isConnected) {
      refreshQuestions();
      refreshUserAnswers();
    }
  }, [contractAddress, isConnected, refreshQuestions, refreshUserAnswers]);

  return {
    questions,
    userAnswers,
    isLoading: isLoading || isPendingWrite || isConfirming,
    error: error || safeWriteError || safeTxError,
    submitAnswer,
    refreshQuestions,
    refreshUserAnswers,
    questionCount: questionCount || null,
    defaultRewardAmount: defaultRewardAmount || null,
    getUserAnswer,
    getUserAnsweredQuestions,
  };
}

