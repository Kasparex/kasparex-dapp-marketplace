'use client';

import type { ReactNode } from 'react';
import { Alert } from '@/components/Alert';
import type { CovenantFormAlert } from '@/lib/covenant/datetimeValidation';
import { KX_INFO_DASHED } from '@/lib/hub/shellTokens';

/**
 * Calculation Breakdown slot content: renders below the primary action button.
 * Prefer this over form-top errors / inline status banners.
 */
export function CovenantRailAlerts({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="space-y-2">{children}</div>;
}

export function renderCovenantFormAlerts(alerts: CovenantFormAlert[]) {
  if (!alerts.length) return null;
  return alerts.map((a) => (
    <Alert key={a.id} type={a.tone === 'info' ? 'info' : a.tone} compact region>
      {a.message}
    </Alert>
  ));
}

/** Dashed informational note next to a field group (not a post-CTA alert). */
export function CovenantInfoNote({ children }: { children: ReactNode }) {
  return <div className={KX_INFO_DASHED}>{children}</div>;
}
