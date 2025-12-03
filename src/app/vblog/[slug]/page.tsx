import { ArticlePageContent } from './ArticlePageContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params (empty array - articles are client-side only)
// For static export, we can't access localStorage during build
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return []; // Empty array - routes will work client-side
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Article: ${slug} - Kasparex vBlog`,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params; // Await params to ensure proper server component behavior
  return <ArticlePageContent slug={slug} />;
}
