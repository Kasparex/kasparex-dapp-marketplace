/**
 * vProgs Simulator Testing UI
 * Allows testing dApp functionality before vProgs launch
 */

'use client';

import { useState, useEffect } from 'react';
import { getVProgsSimulator } from '@/lib/vprogs/simulator';
import type { VProgsDApp, VProgsUsageEvent } from '@/lib/vprogs/types';

export function VProgsSimulator() {
  const [dApps, setDApps] = useState<VProgsDApp[]>([]);
  const [events, setEvents] = useState<VProgsUsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const simulator = getVProgsSimulator();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      const allDApps = simulator.getAllDApps();
      setDApps(allDApps);
      
      // Get all events (in real implementation, would filter by user)
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearState = () => {
    if (confirm('Clear all simulator data?')) {
      simulator.clearState();
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            vProgs Simulator
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test dApp functionality before vProgs launch
          </p>
        </div>
        <button
          onClick={handleClearState}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
        >
          Clear State
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Registered dApps
          </h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {dApps.length}
          </p>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Usage Events
          </h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {events.length}
          </p>
        </div>
      </div>

      {dApps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Registered dApps
          </h3>
          <div className="space-y-2">
            {dApps.map((dApp) => (
              <div
                key={dApp.id}
                className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {dApp.name}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      ID: {dApp.id} | {dApp.category}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      dApp.isActive
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {dApp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dApps.length === 0 && !isLoading && (
        <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No dApps registered yet. Start testing by registering a dApp.
          </p>
        </div>
      )}
    </div>
  );
}

