'use client';

interface NetworkInfoMessageProps {
  networkType: 'L1' | 'L2';
  message?: string;
  className?: string;
}

export function NetworkInfoMessage({ 
  networkType, 
  message,
  className = '' 
}: NetworkInfoMessageProps) {
  const defaultMessage = networkType === 'L1'
    ? 'This dApp runs on L1 (Kaspa network). Connect your Kaspa wallet to interact.'
    : 'This dApp runs on L2 (EVM-compatible network). Connect your EVM wallet to interact.';

  const displayMessage = message || defaultMessage;

  const bgColor = networkType === 'L1'
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';

  const textColor = networkType === 'L1'
    ? 'text-blue-800 dark:text-blue-200'
    : 'text-purple-800 dark:text-purple-200';

  const badgeColor = networkType === 'L1'
    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';

  return (
    <div className={`rounded-lg border p-4 ${bgColor} ${className}`}>
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColor} flex-shrink-0`}
        >
          {networkType}
        </span>
        <p className={`text-sm ${textColor} flex-1`}>
          {displayMessage}
        </p>
      </div>
    </div>
  );
}
