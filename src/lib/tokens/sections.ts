/** Shared layout for token tab panel sections (consistent headline spacing). */
export const TOKEN_TAB_SECTION_CLASS = 'scroll-mt-28 space-y-6';

export function getTokenWhitepaperUrl(token: {
  whitepaperUrl?: string;
  links?: { label: string; url: string; type?: string }[];
}): string | null {
  if (token.whitepaperUrl?.trim()) return token.whitepaperUrl.trim();
  const link = token.links?.find(
    (item) => item.type === 'whitepaper' || /whitepaper/i.test(item.label),
  );
  return link?.url?.trim() ?? null;
}
