import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { VehiclesListing } from '@/components/chronicles/VehiclesListing';
import { getAllVehicles } from '@/lib/chronicles/loaders';

export default function ChroniclesVehiclesPage() {
  const vehicles = getAllVehicles();

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Vehicles & tech"
        titleAccent="tech"
        subtitle="Ships, craft, and technology from the Chronicles universe."
      />
      <VehiclesListing initial={vehicles} title="All vehicles & tech" />
    </div>
  );
}
