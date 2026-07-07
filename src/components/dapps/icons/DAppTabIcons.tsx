'use client';

function IconBase(props: { children: React.ReactNode; className?: string }) {
  return <span className={props.className ?? 'inline-flex h-4 w-4 items-center justify-center'}>{props.children}</span>;
}

export function IconDAppWidget(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM14 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" strokeWidth="2" />
      </svg>
    </IconBase>
  );
}

export function IconDAppFees(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconRevenueTree(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M12 3v4m0 0a3 3 0 100 6m0-6a3 3 0 110 6m0 0v4m-6-2a3 3 0 100-6m6 8a3 3 0 100 6m-6-6a3 3 0 110-6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconArticle(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconAuthor(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconModules(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export { IconOverview, IconComments } from '@/components/games/icons/TabIcons';

export function IconMetadata(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 11h6M9 15h4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}
