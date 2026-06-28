import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { ChaptersListing } from '@/components/chronicles/ChaptersListing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { getChapterSummaries } from '@/lib/chronicles/loaders';

export default function ChroniclesChaptersPage() {
  const chapters = getChapterSummaries();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Chapters"
        titleAccent="Chapters"
        subtitle="Published saga: previous, current, and future beats."
      />
      <DAppSectionHeader
        title="All chapters"
        hint="Browse the full chapter list with search, timeline filters, and view modes."
        className="mb-6"
      />
      <ChaptersListing initialChapters={chapters} />
    </div>
  );
}
