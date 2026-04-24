'use client';

export function DiamondIcon(props: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden={props.title ? undefined : true}
      role={props.title ? 'img' : 'presentation'}
      className={props.className ?? 'h-4 w-4'}
    >
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M12 3.5l4.6 3.1 3 4.1-7.6 9.8L4.4 10.7l3-4.1L12 3.5z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M7.6 6.6L12 20.5l4.4-13.9" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <path d="M4.4 10.7H19.6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
    </svg>
  );
}

