'use client';

interface RevenueTreeStatsProps {
  totalRevenue: number;
  activeTrees: number;
  totalDownline: number;
  totalVolume: number;
}

export function RevenueTreeStats({ totalRevenue, activeTrees, totalDownline, totalVolume }: RevenueTreeStatsProps) {
  const stats = [
    {
      label: 'Total Revenue Earned',
      value: totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unit: 'KAS',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Active Revenue Trees',
      value: activeTrees.toString(),
      unit: '',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Downline Users',
      value: totalDownline.toLocaleString(),
      unit: '',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Total Volume Generated',
      value: totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unit: 'KAS',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            {stat.label}
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {stat.value}
            </div>
            {stat.unit && (
              <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                {stat.unit}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
