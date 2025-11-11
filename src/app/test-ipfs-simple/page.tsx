/**
 * Simple IPFS Test Page (No Header/Footer)
 * Minimal test to isolate compilation issues
 */

'use client';

import { useState } from 'react';
import { useIPFSUpload } from '@/lib/ipfs/hooks';

export default function SimpleIPFSTestPage() {
  const [testText, setTestText] = useState('Hello from Kasparex!');
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);
  
  const { upload, uploadJSON, isUploading, error, hash } = useIPFSUpload();

  const handleTextUpload = async () => {
    const blob = new Blob([testText], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    const cid = await upload(file, { filename: 'test.txt', pin: true });
    if (cid) {
      setUploadedHash(cid);
    }
  };

  const handleJSONUpload = async () => {
    const data = { name: 'Test dApp', version: '1.0.0', timestamp: Date.now() };
    const cid = await uploadJSON(data, { pin: true });
    if (cid) {
      setUploadedHash(cid);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Simple IPFS Test
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Minimal test page without Header/Footer
          </p>
        </div>

        {/* Text Upload */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Upload Text File
          </h2>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 mb-4"
            rows={4}
          />
          <button
            onClick={handleTextUpload}
            disabled={isUploading || !testText.trim()}
            className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
        </div>

        {/* JSON Upload */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Upload JSON
          </h2>
          <button
            onClick={handleJSONUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload JSON to IPFS'}
          </button>
        </div>

        {/* Results */}
        {hash && (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
              ✅ Upload Successful!
            </h2>
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">CID:</p>
            <code className="block text-xs font-mono bg-white dark:bg-zinc-900 p-2 rounded break-all">
              {hash}
            </code>
            <a
              href={`https://gateway.pinata.cloud/ipfs/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#02abb8] hover:underline mt-2 inline-block"
            >
              View on Pinata Gateway →
            </a>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
              ❌ Error
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

