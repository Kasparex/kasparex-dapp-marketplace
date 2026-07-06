'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import {
  buildCovenantUtilityHref,
  COVENANT_UTILITY_TEMPLATES,
  getCovenantUtilityTemplate,
} from '@/lib/programmable/covenantUtilities';
import { canUseProgrammableUtility, resolveProgrammableCovenantId } from '@/lib/programmable/eligibility';
import { tokenHasModule } from '@/lib/tokens/modules';

export function TokenCovenantUtilitiesPanel({ token }: { token: Token }) {
  if (!canUseProgrammableUtility(token) || !tokenHasModule(token.paidModuleIds, 'covenant_utilities_hub')) {
    return null;
  }

  const selected = token.modulesConfig?.covenantUtilityTemplates ?? COVENANT_UTILITY_TEMPLATES.map((t) => t.id);
  const covenantId = resolveProgrammableCovenantId(token);
  const templates = selected
    .map((id) => getCovenantUtilityTemplate(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (templates.length === 0) return null;

  return (
    <div className="space-y-4">
      <DAppSectionHeader title="Covenant utilities" />
      <p className="kx-body-sm">
        Pre-built Kasparex covenant flows linked to this token project. Open a utility to configure escrow,
        splits, milestones, and more in the Lockbox covenant widgets.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <Link
            key={template.id}
            href={buildCovenantUtilityHref(template, { tokenSlug: token.slug, covenantId })}
            className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-cyan-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8]">
                {template.label}
              </p>
              <span className="shrink-0 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                {template.badge}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{template.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
