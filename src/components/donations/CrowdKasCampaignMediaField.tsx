'use client';

import { useMemo } from 'react';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { getBestGatewayUrl } from '@/lib/hub/ipfsStandard';
import { IPFS_MAX_UPLOAD_MB } from '@/lib/ipfs/limits';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';

export function CrowdKasCampaignMediaField({
  source,
  onSourceChange,
  url,
  onUrlChange,
  cid,
  onCidChange,
  fileName,
  onFileNameChange,
  label = 'Cover image',
}: {
  source: 'url' | 'file';
  onSourceChange: (next: 'url' | 'file') => void;
  url: string;
  onUrlChange: (next: string) => void;
  cid: string | null;
  onCidChange: (next: string | null) => void;
  fileName: string | null;
  onFileNameChange: (next: string | null) => void;
  label?: string;
}) {
  const { upload, isUploading } = useIPFSUpload();

  const resolvedPreview = useMemo(() => {
    if (source === 'url') return url.trim();
    return cid ? getBestGatewayUrl(cid) : '';
  }, [cid, source, url]);

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IPFS_MAX_UPLOAD_MB * 1024 * 1024) {
      throw new Error(`Image must be under ${IPFS_MAX_UPLOAD_MB} MB`);
    }
    const uploaded = await upload(file);
    if (!uploaded) return;
    onCidChange(uploaded);
    onFileNameChange(file.name);
    onUrlChange('');
  };

  return (
    <div className="space-y-3">
      <KxFormFieldLabel>{label}</KxFormFieldLabel>
      <KxImageSourceField
        source={source}
        onSourceChange={onSourceChange}
        url={url}
        onUrlChange={onUrlChange}
        urlPlaceholder="https://…"
        urlHint="Direct HTTPS image URL. PNG, JPG, or WebP."
        fileName={fileName}
        onClearFile={() => {
          onCidChange(null);
          onFileNameChange(null);
        }}
        onFileChange={(e) => void uploadCover(e)}
        uploadHint={`PNG, JPG, or WebP up to ${IPFS_MAX_UPLOAD_MB} MB. Stored on IPFS.`}
        isUploading={isUploading}
        inputClassName="k-input"
        accent="emerald"
      />
      {resolvedPreview ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedPreview} alt="Cover preview" className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        URL is fastest. IPFS keeps your campaign image permanent (recommended).
      </p>
    </div>
  );
}
