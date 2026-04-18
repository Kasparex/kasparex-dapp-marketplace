import { notFound } from 'next/navigation';
import { PROTOCOL_FAMILIES, isProtocolFamilySlug } from '@/lib/protocolFamilies';
import { ProtocolFamilyDetailContent } from './ProtocolFamilyDetailContent';

export function generateStaticParams() {
  return PROTOCOL_FAMILIES.map((f) => ({ slug: f.slug }));
}

export default async function ProtocolFamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isProtocolFamilySlug(slug)) notFound();
  const family = PROTOCOL_FAMILIES.find((f) => f.slug === slug)!;
  return <ProtocolFamilyDetailContent family={family} />;
}
