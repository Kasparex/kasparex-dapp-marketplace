import { ArticlePageContent } from './ArticlePageContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params (empty array - articles are client-side only)
// For static export, we can't access localStorage during build
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return []; // Empty array - routes will work client-side
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <ArticlePageContent slug={slug} />;
}
