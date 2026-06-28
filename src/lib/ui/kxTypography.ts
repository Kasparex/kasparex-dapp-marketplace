/** Platform-wide body and prose typography (Kasparex standard). */

/** Primary readable body copy: improved line rhythm (leading-8). */
export const KX_TEXT_BODY = 'text-base text-zinc-600 dark:text-zinc-400 leading-8';

/** Smaller body copy with the same line rhythm. */
export const KX_TEXT_BODY_SM = 'text-sm text-zinc-600 dark:text-zinc-400 leading-8';

/** Intro / teaser under page titles. */
export const KX_TEXT_TEASER = `${KX_TEXT_BODY} mt-4`;

/** Long-form markdown wrapper. */
export const KX_PROSE =
  'max-w-none text-base text-zinc-600 dark:text-zinc-400 leading-8 [&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-100';

export const KX_PROSE_PARAGRAPH = 'mb-6';
export const KX_PROSE_LIST = 'mb-6 space-y-2.5';
export const KX_PROSE_LIST_ITEM = 'leading-8';

/** Panel / aside body copy. */
export const KX_PANEL_BODY = KX_TEXT_BODY;

/** Cyan uppercase kicker label (pairs with KxCategoryKicker). */
export const KX_PANEL_LABEL = 'text-xs font-black uppercase tracking-widest text-[#02abb8]';
