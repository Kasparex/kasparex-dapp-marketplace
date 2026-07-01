'use client';

export type KxLinkRow = { label: string; url: string };

/** Standard styling for in-form "Add …" field buttons (matches dApps listing form). */
export const KX_FORM_ADD_BTN_CLASS =
  'k-control-btn text-xs !border-cyan-500/30 !text-cyan-800 dark:!text-cyan-300';

type KxLinkRowsEditorProps = {
  label: string;
  rows: KxLinkRow[];
  onChange: (rows: KxLinkRow[]) => void;
  addLabel: string;
  maxRows?: number;
  labelMaxLength?: number;
  disabled?: boolean;
};

export function KxLinkRowsEditor({
  label,
  rows,
  onChange,
  addLabel,
  maxRows,
  labelMaxLength,
  disabled = false,
}: KxLinkRowsEditorProps) {
  const atMax = maxRows != null && rows.length >= maxRows;

  return (
    <div className="k-form-group">
      <label className="k-label">{label}</label>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2">
            <input
              type="text"
              className="k-input"
              value={row.label}
              placeholder="Label"
              maxLength={labelMaxLength}
              disabled={disabled}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], label: e.target.value };
                onChange(next);
              }}
            />
            <input
              type="url"
              className="k-input"
              value={row.url}
              placeholder="https://"
              disabled={disabled}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], url: e.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              className="k-control-btn text-xs"
              disabled={disabled || rows.length <= 1}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={KX_FORM_ADD_BTN_CLASS}
          disabled={disabled || atMax}
          onClick={() => onChange([...rows, { label: '', url: '' }])}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
