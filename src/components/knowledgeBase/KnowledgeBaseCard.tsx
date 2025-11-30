import Link from 'next/link';
import { KnowledgeBaseArticle } from '@/lib/knowledgeBase';

interface KnowledgeBaseCardProps {
  article: KnowledgeBaseArticle;
}

export function KnowledgeBaseCard({ article }: KnowledgeBaseCardProps) {
  return (
    <Link
      href={`/knowledge-base/${article.slug}`}
      className="block p-6 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
    >
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        {article.title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {article.description}
      </p>
    </Link>
  );
}

