import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { VehiclesListing } from '@/components/chronicles/VehiclesListing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
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
      <DAppSectionHeader title="All vehicles & tech" className="mb-6" />
      <VehiclesListing initial={vehicles} />
    </div>
  );
}
