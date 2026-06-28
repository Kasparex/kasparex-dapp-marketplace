import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { ChaptersListing } from '@/components/chronicles/ChaptersListing';
import { getChapterSummaries } from '@/lib/chronicles/loaders';

export default function ChroniclesChaptersPage() {
  const chapters = getChapterSummaries();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Chapters"
        titleAccent="Chapters"
        subtitle="Published saga: previous, current, and future beats. Follow the official storyline chapter by chapter through Kaspaland."
        showDefaultActions
      />
      <ChaptersListing initialChapters={chapters} title="All chapters" />
    </div>
  );
}
