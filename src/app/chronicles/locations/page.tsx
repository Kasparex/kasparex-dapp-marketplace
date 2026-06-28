import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { LocationsListing } from '@/components/chronicles/LocationsListing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { getAllLocations } from '@/lib/chronicles/loaders';

export default function ChroniclesLocationsPage() {
  const locations = getAllLocations();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Locations"
        titleAccent="Locations"
        subtitle="Places, regions, and landmarks across Kaspaland."
      />
      <DAppSectionHeader title="All locations" className="mb-6" />
      <LocationsListing initial={locations} />
    </div>
  );
}
