'use client';

import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

type VBlogPollOptionsEditorProps = {
  options: string[];
  onChange: (options: string[]) => void;
  disabled?: boolean;
};

export function VBlogPollOptionsEditor({ options, onChange, disabled = false }: VBlogPollOptionsEditorProps) {
  const atMax = options.length >= MAX_OPTIONS;

  return (
    <div className="space-y-3">
      <label className="k-label">Poll options</label>
      {options.map((option, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            className="k-input flex-1"
            value={option}
            placeholder={`Option ${index + 1}`}
            maxLength={120}
            disabled={disabled}
            onChange={(e) => {
              const next = [...options];
              next[index] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            className="k-control-btn text-xs shrink-0"
            disabled={disabled || options.length <= MIN_OPTIONS}
            onClick={() => onChange(options.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className={KX_FORM_ADD_BTN_CLASS}
        disabled={disabled || atMax}
        onClick={() => onChange([...options, ''])}
      >
        Add option
      </button>
    </div>
  );
}

export function defaultPollOptions(): string[] {
  return ['Option 1', 'Option 2'];
}

export function cleanPollOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean);
}
