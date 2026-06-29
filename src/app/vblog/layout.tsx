import type { Metadata } from 'next';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';

export const metadata: Metadata = buildHubOpenGraphMetadata({
  title: 'Kasparex vBlog - On-chain Articles',
  description: 'Read and publish decentralized articles on Kaspa with Kasparex vBlog.',
  path: '/vblog',
});

export default function VBlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
