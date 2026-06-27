import { redirect } from 'next/navigation';

/** Legacy route: roadmap tools now live on the main listing Tools tab. */
export default function NftToolsRoadmapPage() {
  redirect('/nft?tab=tools');
}
