/**
 * React Hooks for IPFS Operations
 * Auto-upload and content fetching hooks
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getIPFSClient } from './client';
import { IPFS_MAX_UPLOAD_BYTES, IPFS_MAX_UPLOAD_MB } from './limits';
import { fetchJSON, fetchFile } from './gateway';
import { formatHubUploadCid } from '@/lib/hub/ipfsStandard';

export interface UseIPFSUploadResult {
  upload: (file: File | Blob, options?: { filename?: string; pin?: boolean }) => Promise<string | null>;
  uploadJSON: (data: Record<string, unknown>, options?: { pin?: boolean }) => Promise<string | null>;
  /** Returns hub-standard proxy URL for a CID (for form fields and previews). */
  formatCidUrl: (cid: string) => string;
  isUploading: boolean;
  error: Error | null;
  hash: string | null;
}

/**
 * Hook for uploading files to IPFS
 */
export function useIPFSUpload(): UseIPFSUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File | Blob,
    options: { filename?: string; pin?: boolean } = {}
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      if (file.size > IPFS_MAX_UPLOAD_BYTES) {
        throw new Error(`File size must be no more than ${IPFS_MAX_UPLOAD_MB} MB`);
      }

      const client = getIPFSClient();
      const uploadedHash = await client.uploadFile(file, {
        pin: options.pin !== false,
        filename: options.filename,
      });

      setHash(uploadedHash);
      return uploadedHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadJSON = useCallback(async (
    data: Record<string, unknown>,
    options: { pin?: boolean } = {}
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const client = getIPFSClient();
      const uploadedHash = await client.uploadJSON(data, {
        pin: options.pin !== false,
      });

      setHash(uploadedHash);
      return uploadedHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('JSON upload failed');
      setError(error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    upload,
    uploadJSON,
    formatCidUrl: formatHubUploadCid,
    isUploading,
    error,
    hash,
  };
}

export interface UseIPFSContentResult<T = unknown> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching content from IPFS
 */
export function useIPFSContent<T = unknown>(hash: string | null | undefined): UseIPFSContentResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Auto-fetch when hash changes
  useEffect(() => {
    if (!hash) {
      setData(null);
      return;
    }

    let cancelled = false;

    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const content = await fetchJSON<T>(hash);
        if (!cancelled) {
          setData(content);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to fetch IPFS content');
          setError(error);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [hash]);

  const fetchContent = useCallback(async () => {
    if (!hash) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await fetchJSON<T>(hash);
      setData(content);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch IPFS content');
      setError(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [hash]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchContent,
  };
}

/**
 * Hook for fetching files from IPFS
 */
export function useIPFSFile(hash: string | null | undefined) {
  const [file, setFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Auto-fetch when hash changes
  useEffect(() => {
    if (!hash) {
      setFile(null);
      return;
    }

    let cancelled = false;

    const fetchFileContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const content = await fetchFile(hash);
        if (!cancelled) {
          setFile(content);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to fetch IPFS file');
          setError(error);
          setFile(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFileContent();

    return () => {
      cancelled = true;
    };
  }, [hash]);

  const fetchFileContent = useCallback(async () => {
    if (!hash) {
      setFile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await fetchFile(hash);
      setFile(content);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch IPFS file');
      setError(error);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  }, [hash]);

  return {
    file,
    isLoading,
    error,
    refetch: fetchFileContent,
  };
}

