import { KnowledgeBaseArticle } from '@/lib/knowledgeBase';
import { KxListingCard, KxListingCardBody } from '@/components/kx/KxListingCard';

interface KnowledgeBaseCardProps {
  article: KnowledgeBaseArticle;
}

export function KnowledgeBaseCard({ article }: KnowledgeBaseCardProps) {
  return (
    <KxListingCard href={`/knowledge-base/${article.slug}`} accent="hub" className="h-full">
      <KxListingCardBody comfortable>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {article.description}
        </p>
      </KxListingCardBody>
    </KxListingCard>
  );
}
