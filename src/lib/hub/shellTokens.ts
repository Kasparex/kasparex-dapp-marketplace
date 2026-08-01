/** Shared Kasparex Hub shell design tokens (dApps, tokens, vBlog forms). */

export const KX_PAGE_BG = 'bg-zinc-50 dark:bg-zinc-950';

export const KX_PANEL =
  'rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

export const KX_WIDGET_DETAIL_PANEL =
  'rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

/** Primary form surface for dApp widgets and hub editors (matches vBlog Create Article).
 * Elevated vs page bg (`zinc-50` / `zinc-950`) so panels do not visually merge.
 * Keep dark borders discrete (`zinc-800`); contrast comes from background tone. */
export const KX_FORM_PANEL =
  'rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

/** Amber dashed premium module card (matches vBlog Create Article). */
export const KX_PREMIUM_MODULE_CARD =
  'rounded-2xl border-2 border-dashed border-amber-400/60 dark:border-amber-300/40 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-500/[0.08] dark:to-zinc-900 p-5 sm:p-6 shadow-sm';

/** Dashboard pill tab strip (matches vBlog AuthorDashboard). */
export const KX_DASHBOARD_TAB_SHELL =
  'flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/80 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800';

export const KX_DASHBOARD_TAB_BTN =
  'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300';

export const KX_DASHBOARD_TAB_BTN_ACTIVE =
  'bg-white dark:bg-zinc-800 text-[color:var(--hub-accent,#02abb8)] dark:text-[color:var(--hub-accent-light,var(--hub-accent,#66dfe8))] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-800';

export const KX_CALCULATION_ASIDE =
  'flex flex-col rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5 space-y-4 shadow-[0_10px_30px_-18px_var(--hub-accent-shadow,rgba(2,171,184,0.35))] dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/95';

/** Nested inset group inside a form panel (fees blocks, grouped fields). */
export const KX_FORM_NESTED_GROUP =
  'space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/90 p-5 dark:border-zinc-800 dark:bg-zinc-950/55';

export const KX_PANEL_PADDING = 'p-4 sm:p-5';

export const KX_SURFACE_INSET =
  'rounded-xl border border-zinc-200 bg-zinc-100/90 dark:border-zinc-800 dark:bg-zinc-950/60';

export const KX_SURFACE_ROW =
  'rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60 p-3';

export const KX_INPUT = 'k-input w-full';

export const KX_TEXTAREA = 'k-textarea w-full';

/** Form/editor dropdown trigger: matches input field surface (use instead of k-control-btn in forms). */
export const KX_FIELD_TRIGGER = 'k-field-trigger w-full min-w-0';

export const KX_FIELD_MENU = 'k-field-menu';

export const KX_LABEL = 'k-label';

export const KX_BTN_PRIMARY =
  'w-full py-2.5 rounded-lg bg-[color:var(--hub-accent,#06b6d4)] text-white font-medium hover:bg-[color:var(--hub-accent-hover,#0891b2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const KX_BTN_SECONDARY =
  'w-full py-2.5 rounded-lg border border-[color:var(--hub-accent,#06b6d4)] text-[color:var(--hub-accent,#06b6d4)] font-medium hover:bg-[color:var(--hub-accent-muted,rgba(6,182,212,0.1))] transition-colors disabled:opacity-50';

export const KX_TAB_SECTION = 'scroll-mt-28 space-y-6';

export const KX_DETAIL_HEADER =
  'relative mb-6 scroll-mt-24 overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';

export const KX_EMPTY_STATE =
  'rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/50';

/** 2-col metadata stat cards (Market Cap-style boxes on detail Metadata tabs). */
export const KX_METADATA_STAT_CARD =
  'rounded-2xl border border-zinc-200 bg-zinc-100/90 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950/70';

export const KX_METADATA_STAT_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2';

/** Dashed informational callout (field context, not post-CTA alerts). */
export const KX_INFO_DASHED =
  'rounded-xl border border-dashed border-[color:var(--hub-accent-border,rgba(6,182,212,0.35))] bg-[color:var(--hub-accent-muted,rgba(6,182,212,0.06))] px-3.5 py-3 text-sm leading-snug text-zinc-700 dark:text-zinc-300';

export const KX_ASIDE_PANEL = `${KX_PANEL} ${KX_PANEL_PADDING}`;

export const KX_FORM_GRID = 'grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,1fr)_340px] gap-6 xl:gap-8';

export const KX_STICKY_RAIL = 'xl:sticky xl:top-6 space-y-4 self-start';

/** dApp widget tab: form panel on top, calculation breakdown + actions underneath. */
export const KX_WIDGET_DETAIL_STACK = 'flex flex-col gap-6';
