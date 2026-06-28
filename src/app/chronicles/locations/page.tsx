import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { LocationsListing } from '@/components/chronicles/LocationsListing';
import { getAllLocations } from '@/lib/chronicles/loaders';

export default function ChroniclesLocationsPage() {
  const locations = getAllLocations();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Locations"
        titleAccent="Locations"
        subtitle="Places, regions, and landmarks across Kaspaland. Explore where key story events unfold."
      />
      <LocationsListing initial={locations} title="All locations" />
    </div>
  );
}
