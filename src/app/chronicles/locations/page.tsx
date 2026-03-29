import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { LocationsListing } from '@/components/chronicles/LocationsListing';
import { getAllLocations } from '@/lib/chronicles/loaders';

export default function ChroniclesLocationsPage() {
  const locations = getAllLocations();

  return (
    <div>
      <ChroniclesHeader />
      <div className="mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Locations</h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Kaspaland, Kasparex, and places between.
        </p>
      </div>
      <LocationsListing initial={locations} />
    </div>
  );
}
