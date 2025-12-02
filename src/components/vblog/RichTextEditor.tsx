'use client';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

// Simplified textarea-based editor to avoid react-quill SSR issues
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  maxLength,
  disabled = false,
}: RichTextEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      return; // Don't update if over limit
    }
    onChange(newValue);
  };

  // Count characters
  const characterCount = value.length;

  return (
    <div className="rich-text-editor">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full min-h-[200px] px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-y text-base leading-relaxed"
        style={{ fontFamily: 'inherit' }}
      />
      {maxLength && (
        <div className={`text-xs mt-2 text-right ${
          characterCount > maxLength
            ? 'text-red-500'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}>
          {characterCount} / {maxLength} characters
        </div>
      )}
    </div>
  );
}


