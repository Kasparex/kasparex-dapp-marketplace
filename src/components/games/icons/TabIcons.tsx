'use client';

function IconBase(props: { children: React.ReactNode; className?: string }) {
  return <span className={props.className ?? 'inline-flex h-4 w-4 items-center justify-center'}>{props.children}</span>;
}

export function IconOverview(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h16" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconPlay(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M8 5l12 7-12 7V5z" fill="currentColor" opacity="0.85" />
      </svg>
    </IconBase>
  );
}

export function IconShop(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M6 6h15l-1.5 8.5H8L6 6z" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 6L5 3H2" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z" strokeWidth="2" />
      </svg>
    </IconBase>
  );
}

export function IconBoosters(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </IconBase>
  );
}

export function IconRewards(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7l3-7z" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </IconBase>
  );
}

export function IconComments(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </IconBase>
  );
}

export function IconRedeem(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M7 7h10v4" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 7l-2 2" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 7l2 2" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 17H7v-4" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 17l2-2" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 17l-2-2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconVaults(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M7 10V7a5 5 0 0110 0v3" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10h12v11H6V10z" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </IconBase>
  );
}

export function IconWorkers(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11z" strokeWidth="2" />
        <path d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11z" strokeWidth="2" />
        <path d="M2 20c0-3 3-5 6-5" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 20c0-3-3-5-6-5" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 15h8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconPower(props: { className?: string }) {
  return <IconBoosters className={props.className} />;
}

export function IconSignal(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
        <path d="M8.5 15.5a5 5 0 017 0" strokeWidth="2" strokeLinecap="round" />
        <path d="M5.5 12.5a9 9 0 0113 0" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 9.5a12 12 0 0118 0" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconBot(props: { className?: string }) {
  return (
    <IconBase className={props.className}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M12 3v3" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 6h8" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10a4 4 0 014-4h4a4 4 0 014 4v7a4 4 0 01-4 4h-4a4 4 0 01-4-4v-7z" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9.2 13h.01M14.8 13h.01" strokeWidth="3" strokeLinecap="round" />
        <path d="M9 17h6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

