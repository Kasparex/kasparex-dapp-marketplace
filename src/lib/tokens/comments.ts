/** Stable comment thread id for token pages (shared CommentsSection backend). */
export function tokenCommentsArticleId(slug: string): string {
  return `token:${slug}`;
}
