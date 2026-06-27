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

export { IconOverview, IconComments } from '@/components/games/icons/TabIcons';
