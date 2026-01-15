'use client';

interface NodeRewardsTableProps {
  hasNode: boolean;
  nodeType?: 'light' | 'mirror';
}

const NODE_TYPES = {
  light: { name: 'Light Node', multiplier: 4, feeReduction: 0.1, icon: '🛡️' },
  mirror: { name: 'Mirror Node', multiplier: 5, feeReduction: 0.2, icon: '🛡️' },
};

export function NodeRewardsTable({ hasNode, nodeType }: NodeRewardsTableProps) {
  const nodeTypes = [
    {
      id: 'light',
      ...NODE_TYPES.light,
      isUnlocked: hasNode && nodeType === 'light',
    },
    {
      id: 'mirror',
      ...NODE_TYPES.mirror,
      isUnlocked: hasNode && nodeType === 'mirror',
    },
  ];

  const benefitRows = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'multiplier', label: 'Multiplier' },
    { id: 'feeReduction', label: 'Fee Reduction' },
  ];

  const getCellValue = (nodeType: typeof nodeTypes[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return `Active ${nodeType.name}`;
      case 'multiplier':
        return `${nodeType.multiplier}x`;
      case 'feeReduction':
        return `-${nodeType.feeReduction}%`;
      default:
        return '—';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="border-b border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Rewards
            </th>
            {nodeTypes.map((node) => (
              <th
                key={node.id}
                className={`border-b border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                  node.isUnlocked ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{node.icon}</span>
                  <span>{node.name}</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                  {node.isUnlocked ? (
                    <span className="text-green-600 dark:text-green-400">Active</span>
                  ) : (
                    <span className="text-zinc-400">Inactive</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {benefitRows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
              <td className="border-r border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900">
                {row.label}
              </td>
              {nodeTypes.map((node) => {
                const value = getCellValue(node, row.id);
                
                return (
                  <td
                    key={node.id}
                    className={`border-r border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
                      node.isUnlocked ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                    }`}
                  >
                    <span className={node.isUnlocked ? '' : 'text-zinc-400'}>
                      {value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
