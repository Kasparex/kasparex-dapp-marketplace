import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { LocationsListing } from '@/components/chronicles/LocationsListing';
import { getAllLocations } from '@/lib/chronicles/loaders';

export default function ChroniclesLocationsPage() {
  const locations = getAllLocations();

  return (
    <div>
      <ChroniclesHeader />
      <div className="mb-6">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-1">Locations</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Kaspaland, Kasparex, and places between.</p>
      </div>
      <LocationsListing initial={locations} />
    </div>
  );
}
