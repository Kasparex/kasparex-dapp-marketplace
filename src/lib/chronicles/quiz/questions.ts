import quizBank from '../../../../data/chronicles/chapter-quizzes.json';
import type { ChronicleQuizQuestion } from './types';
import { CHRONICLE_QUIZ_QUESTION_COUNT } from './constants';

const bank = quizBank as Record<string, ChronicleQuizQuestion[]>;

function shuffleArray<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Randomize option order so the correct answer is not always in the same position. */
export function shuffleQuizQuestionOptions(question: ChronicleQuizQuestion): ChronicleQuizQuestion {
  const correctAnswer = question.options[question.correctIndex];
  const options = shuffleArray(question.options);
  return {
    ...question,
    options,
    correctIndex: options.indexOf(correctAnswer),
  };
}

export function getChapterQuizPool(slug: string): ChronicleQuizQuestion[] {
  return bank[slug] ?? [];
}

export function pickRandomChapterQuizQuestions(slug: string, count = CHRONICLE_QUIZ_QUESTION_COUNT): ChronicleQuizQuestion[] {
  const pool = getChapterQuizPool(slug);
  if (pool.length === 0) return [];
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(shuffleQuizQuestionOptions);
}

export function officialChapterHasQuiz(slug: string): boolean {
  return getChapterQuizPool(slug).length >= CHRONICLE_QUIZ_QUESTION_COUNT;
}
