'use client';

import { useMemo, type DependencyList } from 'react';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { getHubFlowPreset, type HubFlowPresetKey } from '@/lib/hub/hubFlowProgress';

/** Register standard Flow Progress on the dApp calculation sidebar. */
export function useRegisterHubFlowProgress(
  preset: HubFlowPresetKey,
  options: {
    busy?: boolean;
    complete?: boolean;
    enabled?: boolean;
  } = {},
  deps: DependencyList = [],
) {
  const enabled = options.enabled ?? true;
  const node = useMemo(
    () => (
      <HubFlowProgress
        steps={getHubFlowPreset(preset)}
        busy={options.busy}
        complete={options.complete}
      />
    ),
    [preset, options.busy, options.complete],
  );

  useRegisterDAppWidgetRailSlot('flowProgress', enabled ? node : null, [node, enabled, ...deps]);
}
