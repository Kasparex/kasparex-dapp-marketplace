'use client';

import type { GameType } from '@/lib/games/games';

export function GameTypeIcon({ type, className = 'h-4 w-4' }: { type: GameType; className?: string }) {
  switch (type) {
    case 'puzzle':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
          />
        </svg>
      );
    case 'arcade':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M9 9v6m6-2h.01M18 9h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l-1 2h12l-1-2a3 3 0 00-3-2H10a3 3 0 00-3 2z" />
        </svg>
      );
    case 'strategy':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M12 21v-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8a4 4 0 118 0c0 2-2 3-2 5H10c0-2-2-3-2-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13h4v4h-4z" />
        </svg>
      );
    case 'casual':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 14l.8 2.4L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.6L5 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l.8 2.4L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.6L19 14z" />
        </svg>
      );
    case 'multiplayer':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11a4 4 0 10-8 0 4 4 0 008 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 20v-1a4 4 0 00-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'trivia':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10a4 4 0 118 0c0 2-2 2-2 4H10c0-2-2-2-2-4z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'skill':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2.5 7H22l-6 4.5L18.5 21 12 16.8 5.5 21 8 13.5 2 9h7.5L12 2z" />
        </svg>
      );
    default:
      return null;
  }
}

