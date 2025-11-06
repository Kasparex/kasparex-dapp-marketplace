'use client';

interface AnalyticsCardProps {
  title: string;
  value: string;
  icon: string;
  description?: string;
}

export function AnalyticsCard({ title, value, icon, description }: AnalyticsCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{value}</p>
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

