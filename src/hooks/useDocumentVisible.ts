'use client';

import { useEffect, useState } from 'react';

/** True when the browser tab is visible (or during SSR). */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

/** React Query refetchInterval: poll only when tab is visible. */
export function visibilityGatedInterval(baseMs: number, visible: boolean): number | false {
  return visible ? baseMs : false;
}
