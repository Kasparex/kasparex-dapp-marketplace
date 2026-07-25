'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePreview } from '@/components/ImagePreview';

export interface ImageUploadProps {
  value: string; // Current image URL or CID
  onChange: (urlOrCid: string) => void;
  onFileSelect?: (file: File) => Promise<string | null>; // Upload function that returns CID
  onDelete?: () => void;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  maxSizeMB?: number;
  acceptedFormats?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showUrlInput?: boolean; // Whether to show URL input field
  showFileUpload?: boolean; // Whether to show file upload
}

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  onDelete,
  label = 'Image',
  aspectRatio = 'auto',
  maxSizeMB = 5,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  placeholder = 'Enter image URL or upload a file',
  className = '',
  disabled = false,
  showUrlInput = true,
  showFileUpload = true,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    return null;
  }, [acceptedFormats, maxSizeMB]);

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    if (!onFileSelect) {
      setUploadError('File upload not configured');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const cid = await onFileSelect(file);
      if (cid) {
        onChange(cid);
        setUrlInput(cid);
      } else {
        setUploadError('Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onFileSelect, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !showFileUpload) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      setUploadError('Please drop an image file');
    }
  }, [disabled, showFileUpload, handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    onChange(url);
  }, [onChange]);

  const handleDelete = useCallback(() => {
    setUrlInput('');
    onChange('');
    if (onDelete) {
      onDelete();
    }
  }, [onChange, onDelete]);

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}

      {/* URL Input */}
      {showUrlInput && (
        <div>
          <input
            type="text"
            value={urlInput}
            onChange={handleUrlChange}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--hub-accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Enter an image URL (http:// or https://) or IPFS CID
          </p>
        </div>
      )}

      {/* File Upload Area */}
      {showFileUpload && onFileSelect && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging
              ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted)]'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50'
            }
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[color:var(--hub-accent-border)]'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            disabled={disabled || isUploading}
            className="hidden"
            id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--hub-accent)] mx-auto" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Uploading to IPFS...</p>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h-12m-2-5h.01M17 13h.01"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-2">
                <label
                  htmlFor={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
                  className="cursor-pointer text-sm font-medium text-[color:var(--hub-accent)] hover:text-[color:var(--hub-accent-hover)]"
                >
                  Click to upload
                </label>
                <span className="text-sm text-zinc-600 dark:text-zinc-400"> or drag and drop</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                PNG, JPG, WebP up to {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Preview</span>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={disabled}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <ImagePreview
            imageUrl={value}
            alt={`${label} preview`}
            aspectRatio={aspectRatio}
            className="max-w-full"
          />
        </div>
      )}
    </div>
  );
}
