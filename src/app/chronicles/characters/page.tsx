import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { CharactersListing } from '@/components/chronicles/CharactersListing';
import { getAllCharacters } from '@/lib/chronicles/loaders';

export default function ChroniclesCharactersPage() {
  const characters = getAllCharacters();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Characters"
        titleAccent="Characters"
        subtitle="People, AI, factions, and future token pages. Meet the cast and groups shaping the Kasparex saga."
      />
      <CharactersListing initial={characters} title="All characters" />
    </div>
  );
}
