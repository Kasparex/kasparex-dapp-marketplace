import { ArticlePageContent } from './ArticlePageContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params (empty array - articles are client-side only)
// For static export, we can't access localStorage during build
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  // Return empty array - routes will work client-side
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Article: ${slug} - Kasparex vBlog`,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <ArticlePageContent slug={slug} />;
}
