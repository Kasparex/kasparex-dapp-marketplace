import quizBank from '../../../../data/chronicles/chapter-quizzes.json';
import type { ChronicleQuizQuestion } from './types';
import { CHRONICLE_QUIZ_QUESTION_COUNT } from './constants';

const bank = quizBank as Record<string, ChronicleQuizQuestion[]>;

export function getChapterQuizPool(slug: string): ChronicleQuizQuestion[] {
  return bank[slug] ?? [];
}

export function pickRandomChapterQuizQuestions(slug: string, count = CHRONICLE_QUIZ_QUESTION_COUNT): ChronicleQuizQuestion[] {
  const pool = getChapterQuizPool(slug);
  if (pool.length === 0) return [];
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function officialChapterHasQuiz(slug: string): boolean {
  return getChapterQuizPool(slug).length >= CHRONICLE_QUIZ_QUESTION_COUNT;
}
