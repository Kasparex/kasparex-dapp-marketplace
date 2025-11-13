'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { QUIZ_TO_EARN_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useSafeError } from './useSafeError';
import { getErrorMessage } from '@/lib/utils';

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

  const contractAddressRaw = getContractAddress(chainId, 'QuizToEarn');
  
  // CRITICAL: Validate contract address - empty or invalid addresses cause function-type errors
  // Only use valid Ethereum addresses (starts with 0x, 42 characters)
  const contractAddress = contractAddressRaw && 
    contractAddressRaw.startsWith('0x') && 
    contractAddressRaw.length === 42 
    ? contractAddressRaw 
    : null;

  // Read contract state
  // CRITICAL: Wrap useReadContract hooks to intercept function-type errors
  const { data: questionCountRaw, error: questionCountError } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: QUIZ_TO_EARN_ABI,
    functionName: 'questionCount',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  const { data: defaultRewardAmountRaw, error: defaultRewardAmountError } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: QUIZ_TO_EARN_ABI,
    functionName: 'defaultRewardAmount',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  // CRITICAL: Convert function-type errors from useReadContract hooks immediately
  useEffect(() => {
    if (questionCountError) {
      if (typeof questionCountError === 'function') {
        const errorStr = getErrorMessage(questionCountError, 'Failed to load question count');
        console.error('🚨 Function-type error in useReadContract (questionCount):', errorStr);
        setError(errorStr);
      }
    }
  }, [questionCountError]);

  useEffect(() => {
    if (defaultRewardAmountError) {
      if (typeof defaultRewardAmountError === 'function') {
        const errorStr = getErrorMessage(defaultRewardAmountError, 'Failed to load default reward amount');
        console.error('🚨 Function-type error in useReadContract (defaultRewardAmount):', errorStr);
        setError(errorStr);
      }
    }
  }, [defaultRewardAmountError]);

  // Properly handle unknown types from useReadContract
  const questionCount: bigint | null = useMemo(() => {
    if (!questionCountRaw) return null;
    if (typeof questionCountRaw === 'bigint') return questionCountRaw;
    if (typeof questionCountRaw === 'number') return BigInt(questionCountRaw);
    if (typeof questionCountRaw === 'string') return BigInt(questionCountRaw);
    return null;
  }, [questionCountRaw]);

  const defaultRewardAmount: bigint | null = useMemo(() => {
    if (!defaultRewardAmountRaw) return null;
    if (typeof defaultRewardAmountRaw === 'bigint') return defaultRewardAmountRaw;
    if (typeof defaultRewardAmountRaw === 'number') return BigInt(defaultRewardAmountRaw);
    if (typeof defaultRewardAmountRaw === 'string') return BigInt(defaultRewardAmountRaw);
    return null;
  }, [defaultRewardAmountRaw]);

  // Write contract
  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    hash,
  });

  // CRITICAL: Intercept writeError immediately to convert function-type errors
  // This must happen BEFORE React Query tries to serialize the error
  useEffect(() => {
    if (writeError) {
      // Check if error is a function - if so, convert immediately
      if (typeof writeError === 'function') {
        const errorStr = getErrorMessage(writeError, 'Transaction failed');
        console.error('🚨 Function-type error intercepted in useQuizToEarn writeError:', errorStr);
        console.error('Contract address:', contractAddress, 'Chain ID:', chainId);
        // Set error immediately to prevent React Query from seeing the function
        setError(errorStr);
      }
    }
  }, [writeError, contractAddress, chainId]);

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
      // CRITICAL: Wrap readContract calls to catch and convert function-type errors immediately
      let countResult: unknown;
      try {
        countResult = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: QUIZ_TO_EARN_ABI,
          functionName: 'questionCount',
        });
      } catch (readErr) {
        // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
        if (typeof readErr === 'function') {
          const errorStr = getErrorMessage(readErr, 'Failed to load question count');
          console.error('Error loading question count:', errorStr);
          setError(errorStr);
          setIsLoading(false);
          return;
        }
        throw readErr; // Re-throw if not a function-type error
      }

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
          // CRITICAL: Wrap readContract calls to catch and convert function-type errors immediately
          let result: unknown;
          try {
            result = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: QUIZ_TO_EARN_ABI,
              functionName: 'getActiveQuestions',
              args: [offset, batchSize],
            });
          } catch (readErr) {
            // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
            if (typeof readErr === 'function') {
              const errorStr = getErrorMessage(readErr, `Failed to load questions batch at offset ${offset}`);
              console.error('Error loading questions batch:', errorStr);
              // Break out of loop on function-type error
              break;
            }
            throw readErr; // Re-throw if not a function-type error
          }

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
      // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
      let errorMessage: string;
      if (typeof err === 'function') {
        errorMessage = getErrorMessage(err, 'Failed to load questions');
        console.error('🚨 Function-type error in refreshQuestions:', errorMessage);
      } else {
        errorMessage = getErrorMessage(err, 'Failed to load questions');
      }
      setError(errorMessage);
      console.error('Error loading questions:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, publicClient, isConnected]);

  // Load user answers
  const refreshUserAnswers = useCallback(async () => {
    // CRITICAL: Validate contract address BEFORE calling readContract
    if (!contractAddress || contractAddress === '' || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      setUserAnswers(new Map());
      return;
    }

    if (!publicClient || !isConnected || !address) {
      return;
    }

    try {
      // Get list of answered question IDs
      // CRITICAL: Wrap readContract calls to catch and convert function-type errors immediately
      let answeredIdsResult: unknown;
      try {
        answeredIdsResult = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: QUIZ_TO_EARN_ABI,
          functionName: 'getUserAnsweredQuestions',
          args: [address],
        });
      } catch (readErr) {
        // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
        if (typeof readErr === 'function') {
          const errorStr = getErrorMessage(readErr, 'Failed to load user answered questions');
          console.error('🚨 Function-type error in refreshUserAnswers (getUserAnsweredQuestions):', errorStr);
          setUserAnswers(new Map());
          return;
        }
        throw readErr; // Re-throw if not a function-type error
      }

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
          // CRITICAL: Wrap readContract calls to catch and convert function-type errors immediately
          let answerResult: unknown;
          try {
            answerResult = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: QUIZ_TO_EARN_ABI,
              functionName: 'getUserAnswer',
              args: [address, questionId],
            });
          } catch (readErr) {
            // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
            if (typeof readErr === 'function') {
              const errorStr = getErrorMessage(readErr, `Failed to load answer for question ${questionId}`);
              console.error(`🚨 Function-type error loading answer for question ${questionId}:`, errorStr);
              continue; // Skip this answer and continue with next
            }
            throw readErr; // Re-throw if not a function-type error
          }

          // Properly handle unknown type from readContract
          if (!answerResult || typeof answerResult !== 'object' || !('timestamp' in answerResult)) {
            continue;
          }

          const answer = answerResult as {
            questionId: bigint;
            selectedAnswerIndex: bigint;
            isCorrect: boolean;
            timestamp: bigint;
            rewardClaimed: boolean;
          };

          answersMap.set(questionId, {
            questionId: answer.questionId,
            selectedAnswerIndex: answer.selectedAnswerIndex,
            isCorrect: answer.isCorrect,
            timestamp: answer.timestamp,
            rewardClaimed: answer.rewardClaimed,
          });
        } catch (err) {
          // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
          if (typeof err === 'function') {
            const errorStr = getErrorMessage(err, `Failed to load answer for question ${questionId}`);
            console.error(`🚨 Function-type error loading answer for question ${questionId}:`, errorStr);
          } else {
            console.error(`Error loading answer for question ${questionId}:`, err);
          }
        }
      }

      setUserAnswers(answersMap);
    } catch (err) {
      // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
      if (typeof err === 'function') {
        const errorStr = getErrorMessage(err, 'Failed to load user answers');
        console.error('🚨 Function-type error in refreshUserAnswers:', errorStr);
      } else {
        console.error('Error loading user answers:', err);
      }
    }
  }, [contractAddress, publicClient, isConnected, address]);

  // Get user answer for a specific question
  const getUserAnswer = useCallback(async (questionId: bigint): Promise<UserAnswer | null> => {
    // CRITICAL: Validate contract address BEFORE calling readContract
    if (!contractAddress || contractAddress === '' || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      return null;
    }

    if (!publicClient || !isConnected || !address) {
      return null;
    }

    try {
      // CRITICAL: Wrap readContract calls to catch and convert function-type errors immediately
      let answerResult: unknown;
      try {
        answerResult = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: QUIZ_TO_EARN_ABI,
          functionName: 'getUserAnswer',
          args: [address, questionId],
        });
      } catch (readErr) {
        // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
        if (typeof readErr === 'function') {
          const errorStr = getErrorMessage(readErr, `Failed to get user answer for question ${questionId}`);
          console.error(`🚨 Function-type error in getUserAnswer:`, errorStr);
          return null;
        }
        throw readErr; // Re-throw if not a function-type error
      }

      // Properly handle unknown type from readContract
      if (!answerResult || typeof answerResult !== 'object' || !('timestamp' in answerResult)) {
        return null;
      }

      const answer = answerResult as {
        questionId: bigint;
        selectedAnswerIndex: bigint;
        isCorrect: boolean;
        timestamp: bigint;
        rewardClaimed: boolean;
      };

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
      // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
      if (typeof err === 'function') {
        const errorStr = getErrorMessage(err, `Failed to get user answer for question ${questionId}`);
        console.error(`🚨 Function-type error in getUserAnswer:`, errorStr);
      } else {
        console.error(`Error getting user answer for question ${questionId}:`, err);
      }
      return null;
    }
  }, [contractAddress, publicClient, isConnected, address]);

  // Get user's answered question IDs
  const getUserAnsweredQuestions = useCallback(async (): Promise<bigint[]> => {
    // CRITICAL: Validate contract address BEFORE calling readContract
    if (!contractAddress || contractAddress === '' || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      return [];
    }

    if (!publicClient || !isConnected || !address) {
      return [];
    }

    try {
      // CRITICAL: Wrap readContract calls to catch and convert function-type errors immediately
      let answeredIdsResult: unknown;
      try {
        answeredIdsResult = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: QUIZ_TO_EARN_ABI,
          functionName: 'getUserAnsweredQuestions',
          args: [address],
        });
      } catch (readErr) {
        // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
        if (typeof readErr === 'function') {
          const errorStr = getErrorMessage(readErr, 'Failed to get user answered questions');
          console.error('🚨 Function-type error in getUserAnsweredQuestions:', errorStr);
          return [];
        }
        throw readErr; // Re-throw if not a function-type error
      }

      // Properly handle unknown type from readContract
      if (!Array.isArray(answeredIdsResult)) {
        return [];
      }

      return answeredIdsResult as bigint[];
    } catch (err) {
      // CRITICAL: Convert function-type errors immediately to prevent React Query serialization
      if (typeof err === 'function') {
        const errorStr = getErrorMessage(err, 'Failed to get user answered questions');
        console.error('🚨 Function-type error in getUserAnsweredQuestions:', errorStr);
      } else {
        console.error('Error getting user answered questions:', err);
      }
      return [];
    }
  }, [contractAddress, publicClient, isConnected, address]);

  // Submit answer
  const submitAnswer = useCallback(async (questionId: bigint, selectedAnswerIndex: bigint) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    // CRITICAL: Validate contract address BEFORE calling writeContract
    // Empty or invalid addresses cause wagmi to return function-type errors
    if (!contractAddress || contractAddress === '' || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      const errorMsg = 'Quiz-to-Earn contract is not deployed on this network. Please switch to Kasplex L2 Testnet (Chain ID: 167012).';
      setError(errorMsg);
      console.warn('Invalid contract address:', contractAddress, 'Chain ID:', chainId);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // CRITICAL: Wrap writeContract call to intercept errors immediately
      // wagmi's writeContract doesn't throw - errors come via error state
      // But we wrap it in a try-catch to catch any synchronous errors
      // and also set up immediate error interception
      
      // Clear any previous errors first
      setError(null);
      
      // Call writeContract - it returns void, errors come via writeError state
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: QUIZ_TO_EARN_ABI,
        functionName: 'submitAnswer',
        args: [questionId, selectedAnswerIndex],
      });
      
      // Note: writeContract doesn't return a promise, so we can't await it
      // Errors will come through writeError state, which we intercept in useEffect
      // The transaction hash will come through the hash state
      
    } catch (err) {
      // CRITICAL: Convert function-type errors immediately to prevent 'in' operator errors
      // This catches any synchronous errors (though writeContract shouldn't throw)
      let errorMessage: string;
      let safeError: Error;
      
      if (typeof err === 'function') {
        // Function-type error from wagmi - convert immediately
        errorMessage = getErrorMessage(err, 'Failed to submit answer');
        safeError = new Error(errorMessage);
        console.error('🚨 Function-type error caught in submitAnswer catch block:', errorMessage);
      } else if (err instanceof Error) {
        errorMessage = getErrorMessage(err, 'Failed to submit answer');
        safeError = new Error(errorMessage);
      } else {
        errorMessage = getErrorMessage(err, 'Failed to submit answer');
        safeError = new Error(errorMessage);
      }
      
      setError(errorMessage);
      setIsLoading(false);
      // Always throw an Error object, never a function or raw error
      throw safeError;
    }
  }, [contractAddress, isConnected, address, writeContract, chainId]);

  // Update error state from transaction
  // CRITICAL: Convert errors immediately to prevent React Query serialization issues
  useEffect(() => {
    if (safeWriteError || safeTxError) {
      const errorToSet = safeWriteError || safeTxError;
      if (errorToSet) {
        // Double-check: ensure error is converted to string
        // This prevents any function-type errors from reaching React Query
        const errorStr = typeof errorToSet === 'string' 
          ? errorToSet 
          : getErrorMessage(errorToSet, 'Transaction failed');
        setError(errorStr);
      } else {
        setError(null);
      }
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
    questionCount,
    defaultRewardAmount,
    getUserAnswer,
    getUserAnsweredQuestions,
  };
}

