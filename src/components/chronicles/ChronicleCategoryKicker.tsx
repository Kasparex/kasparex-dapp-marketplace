import type { ReactNode } from 'react';

/** Category kicker above article titles (Chronicles standard tilt bar). */
export function ChronicleCategoryKicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-5 flex items-center gap-2.5 ${className}`.trim()}>
      <div
        className="h-4 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
        aria-hidden="true"
      />
      <p className="text-xs font-black uppercase tracking-widest text-[#02abb8]">{children}</p>
    </div>
  );
}
