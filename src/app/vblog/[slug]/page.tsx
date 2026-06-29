import { ArticlePageContent } from './ArticlePageContent';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return buildHubOpenGraphMetadata({
    title: `Article: ${slug} - Kasparex vBlog`,
    description: 'Read on-chain articles on Kasparex vBlog.',
    path: `/vblog/${slug}`,
    type: 'article',
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <ArticlePageContent slug={slug} />;
}
