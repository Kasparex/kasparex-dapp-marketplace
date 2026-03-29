import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { CharactersListing } from '@/components/chronicles/CharactersListing';
import { getAllCharacters } from '@/lib/chronicles/loaders';

export default function ChroniclesCharactersPage() {
  const characters = getAllCharacters();

  return (
    <div>
      <ChroniclesHeader />
      <div className="mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Characters</h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          People, AI, factions, and future token pages.
        </p>
      </div>
      <CharactersListing initial={characters} />
    </div>
  );
}
