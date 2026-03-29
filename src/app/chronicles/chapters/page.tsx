import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { ChaptersListing } from '@/components/chronicles/ChaptersListing';
import { getChapterSummaries } from '@/lib/chronicles/loaders';

export default function ChroniclesChaptersPage() {
  const chapters = getChapterSummaries();

  return (
    <div>
      <ChroniclesHeader />
      <div className="mb-6">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-1">Chapters</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Published saga — previous, current, and future beats.</p>
      </div>
      <ChaptersListing initialChapters={chapters} />
    </div>
  );
}
