import { AuthorPageContent } from './AuthorPageContent';

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export async function generateStaticParams(): Promise<Array<{ address: string }>> {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { address } = await params;
  return {
    title: `Author: ${address.slice(0, 6)}...${address.slice(-4)} - Kasparex vBlog`,
  };
}

export default async function VBlogAuthorPage({ params }: PageProps) {
  await params;
  return <AuthorPageContent />;
}
