import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { VehiclesListing } from '@/components/chronicles/VehiclesListing';
import { getAllVehicles } from '@/lib/chronicles/loaders';

export default function ChroniclesVehiclesPage() {
  const vehicles = getAllVehicles();

  return (
    <div>
      <ChroniclesHeader />
      <div className="mb-6">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-1">Vehicles & tech</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Craft, transport, and devices of Kaspaland.</p>
      </div>
      <VehiclesListing initial={vehicles} />
    </div>
  );
}
