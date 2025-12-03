import { ArticlePageContent } from './ArticlePageContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
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
