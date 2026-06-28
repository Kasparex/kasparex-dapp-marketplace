/** Shared Chronicles reading typography (re-exports platform tokens). */

export {
  KX_TEXT_BODY as CHRONICLES_BODY,
  KX_TEXT_BODY as CHRONICLES_TEASER,
  KX_TEXT_TEASER,
  KX_PROSE as CHRONICLES_PROSE,
  KX_PANEL_BODY as CHRONICLES_PANEL_BODY,
  KX_PANEL_LABEL as CHRONICLES_PANEL_LABEL,
} from '@/lib/ui/kxTypography';

export { KX_KICKER_TO_TITLE, KX_SECTION_HEADER_MARGIN, KX_TITLE_TO_TEASER } from '@/lib/ui/kxLayout';

/** Standard panel chrome (matches KxListingCard / dApps surfaces). */
export const CHRONICLES_PANEL =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
