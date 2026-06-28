import { ChronicleCommunityDetailPage } from '@/components/chronicles/ChronicleCommunityDetailPage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChronicleArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <ChronicleCommunityDetailPage slug={slug} kind="article" />;
}
