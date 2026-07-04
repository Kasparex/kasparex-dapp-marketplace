'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { Alert } from '@/components/Alert';
import { canUseProgrammableUtility } from '@/lib/programmable/eligibility';
import { tokenHasModule } from '@/lib/tokens/modules';

export function TokenNativeSubscriptionsPanel({ token }: { token: Token }) {
  if (!canUseProgrammableUtility(token) || !tokenHasModule(token.paidModuleIds, 'native_subscriptions')) {
    return null;
  }

  const note =
    token.modulesConfig?.subscriptionsNote?.trim() ||
    'Native subscriptions for programmable tokens are coming as Kaspa L1 payment rails and wallet APIs expand. Use Covenant Milestone or Store checkout flows in the meantime.';

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900/50">
      <DAppSectionHeader title="Native subscriptions" className="mb-1" />
      <Alert type="info">
        Placeholder module: recurring access billed in your project token will surface here when Hub payment
        integrations support KCC-20.
      </Alert>
      <p className="kx-body-sm whitespace-pre-wrap">{note}</p>
    </div>
  );
}
