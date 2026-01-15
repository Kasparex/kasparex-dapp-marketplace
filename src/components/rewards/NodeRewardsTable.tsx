'use client';

interface NodeRewardsTableProps {
  hasNode: boolean;
  nodeType?: 'light' | 'mirror';
}

const NODE_TYPES = {
  light: { name: 'Light Node', multiplier: 4, feeReduction: 0.1 },
  mirror: { name: 'Mirror Node', multiplier: 5, feeReduction: 0.2 },
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Rewards
            </th>
            {nodeTypes.map((node) => (
              <th
                key={node.id}
                className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                  node.isUnlocked ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                }`}
              >
                <div>{node.name}</div>
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
            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900">
                {row.label}
              </td>
              {nodeTypes.map((node) => {
                const value = getCellValue(node, row.id);
                
                return (
                  <td
                    key={node.id}
                    className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center ${
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
