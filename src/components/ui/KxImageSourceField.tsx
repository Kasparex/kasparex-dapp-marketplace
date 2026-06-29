'use client';

import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxFileUpload } from '@/components/ui/KxFileUpload';

type ImageSource = 'url' | 'file';

export function KxImageSourceField({
  source,
  onSourceChange,
  url,
  onUrlChange,
  urlPlaceholder = 'https://...',
  urlHint = 'Direct HTTPS image URL. PNG, JPG, or WebP.',
  fileName,
  onClearFile,
  onFileChange,
  uploadHint,
  isUploading,
  inputClassName = 'k-modal-field-input',
}: {
  source: ImageSource;
  onSourceChange: (next: ImageSource) => void;
  url: string;
  onUrlChange: (next: string) => void;
  urlPlaceholder?: string;
  urlHint?: string;
  fileName?: string | null;
  onClearFile?: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadHint?: string;
  isUploading?: boolean;
  inputClassName?: string;
}) {
  return (
    <div className="space-y-3">
      <KxSegmentToggle
        value={source}
        onChange={onSourceChange}
        options={[
          { value: 'url', label: 'Image URL' },
          { value: 'file', label: 'Upload (IPFS)' },
        ]}
        ariaLabel="Image source"
      />
      {source === 'url' ? (
        <div>
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={urlPlaceholder}
            className={inputClassName}
          />
          <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">{urlHint}</p>
        </div>
      ) : (
        <KxFileUpload
          label=""
          hint={uploadHint}
          accept="image/*"
          fileName={fileName}
          onClear={onClearFile}
          onChange={onFileChange}
          disabled={isUploading}
        />
      )}
    </div>
  );
}
