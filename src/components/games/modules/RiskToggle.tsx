'use client';

export function RiskToggle(props: {
  value: 'cashout' | 'push' | 'none';
  onChange: (v: 'cashout' | 'push' | 'none') => void;
  disabled?: boolean;
  label?: string;
}) {
  const value = props.value;
  const disabled = Boolean(props.disabled);
  const label = props.label ?? 'Risk choice';

  function btnClass(active: boolean): string {
    return [
      'px-3 py-2 rounded-md text-sm font-medium border transition-colors',
      active
        ? 'bg-[#02abb8] text-white border-[#02abb8]'
        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800',
      disabled ? 'opacity-60 cursor-not-allowed' : '',
    ].join(' ');
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Optional</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={disabled}
          className={btnClass(value === 'none')}
          onClick={() => props.onChange('none')}
        >
          None
        </button>
        <button
          type="button"
          disabled={disabled}
          className={btnClass(value === 'cashout')}
          onClick={() => props.onChange('cashout')}
        >
          Cashout
        </button>
        <button
          type="button"
          disabled={disabled}
          className={btnClass(value === 'push')}
          onClick={() => props.onChange('push')}
        >
          Push
        </button>
      </div>
    </div>
  );
}

