import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { CharactersListing } from '@/components/chronicles/CharactersListing';
import { getAllCharacters } from '@/lib/chronicles/loaders';

export default function ChroniclesCharactersPage() {
  const characters = getAllCharacters();

  return (
    <div>
      <ChroniclesHeader />
      <div className="mb-6">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-1">Characters</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">People, AI, factions — future token pages.</p>
      </div>
      <CharactersListing initial={characters} />
    </div>
  );
}
