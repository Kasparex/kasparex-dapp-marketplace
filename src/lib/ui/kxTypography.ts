/** Platform-wide body and prose typography (Kasparex standard). */

/** Primary readable body copy: Store product description size (text-lg / 18px). */
export const KX_TEXT_BODY = 'text-lg text-zinc-600 dark:text-zinc-400 leading-8';

/** Compact body for listing cards and dense UI (text-base / 16px). */
export const KX_TEXT_BODY_SM = 'text-base text-zinc-600 dark:text-zinc-400 leading-8';

/** Intro / teaser under page titles. */
export const KX_TEXT_TEASER = `${KX_TEXT_BODY} mt-4`;

/** Long-form markdown wrapper. */
export const KX_PROSE =
  'max-w-none text-lg text-zinc-600 dark:text-zinc-400 leading-8 [&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-100';

export const KX_PROSE_PARAGRAPH = 'mb-6';
export const KX_PROSE_LIST = 'mb-6 space-y-2.5';
export const KX_PROSE_LIST_ITEM = 'leading-8';

/** Panel / aside body copy. */
export const KX_PANEL_BODY = KX_TEXT_BODY;

/** Cyan uppercase kicker label (pairs with KxCategoryKicker). */
export const KX_PANEL_LABEL = 'text-xs font-black uppercase tracking-widest text-[#02abb8]';

/** Tailwind class for main body copy (prefer over duplicating KX_TEXT_BODY). */
export const KX_BODY_CLASS = 'kx-body';

/** Tailwind class for compact listing descriptions. */
export const KX_BODY_SM_CLASS = 'kx-body-sm';

/** Tailwind class for long-form prose blocks. */
export const KX_PROSE_CLASS = 'kx-prose';
