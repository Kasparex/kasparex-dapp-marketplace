import { deterministicStringify } from '@/lib/vblog/pricing';

export function buildCanonicalGenesisPayload(args: {
  contentHtml: string;
  author: string;
}): string {
  const canonical = {
    v: 1,
    action: 'leave-message',
    content: args.contentHtml.trim(),
    author: args.author.trim(),
  };
  return deterministicStringify(canonical);
}
