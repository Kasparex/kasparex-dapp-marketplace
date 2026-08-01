'use client';

import type { ReactNode } from 'react';

function IconBase(props: { children: ReactNode; className?: string }) {
  return <span className={props.className ?? 'inline-flex h-4 w-4 shrink-0 items-center justify-center'}>{props.children}</span>;
}

export function IconTokenOverview(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h16" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconTokenRoadmap(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconTokenMarkets(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconTokenSwap(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M8 7h12M8 7l3-3M8 7l3 3M16 17H4M16 17l-3 3M16 17l-3-3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconTokenUtility(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IconBase>
  );
}

export function IconTokenComments(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M8 10h8m-8 4h6M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l1.3-3.9A7.4 7.4 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconTokenShop(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M3 9l1-4h16l1 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9M9 13h6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconTokenAuthor(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}
