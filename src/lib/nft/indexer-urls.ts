/** KRC721 indexer base URLs (comma-separated in KRC721_INDEXER_URLS). */
export function getKrc721IndexerBases(): string[] {
  const fromEnv = typeof process !== 'undefined' ? process.env.KRC721_INDEXER_URLS : undefined;
  const defaults = ['https://mainnet.krc721.stream'];
  if (!fromEnv?.trim()) return defaults;
  const parsed = fromEnv
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return parsed.length > 0 ? parsed : defaults;
}
