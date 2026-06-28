import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { CharactersListing } from '@/components/chronicles/CharactersListing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { getAllCharacters } from '@/lib/chronicles/loaders';

export default function ChroniclesCharactersPage() {
  const characters = getAllCharacters();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Characters"
        titleAccent="Characters"
        subtitle="People, AI, factions, and future token pages."
      />
      <DAppSectionHeader title="All characters" className="mb-6" />
      <CharactersListing initial={characters} />
    </div>
  );
}
