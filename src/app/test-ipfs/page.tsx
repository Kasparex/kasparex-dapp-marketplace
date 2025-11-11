/**
 * IPFS Test Page
 * Simple page to test Pinata IPFS integration
 */

'use client';

import { useState } from 'react';
import { useIPFSUpload, useIPFSContent } from '@/lib/ipfs/hooks';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TestIPFSPage() {
  const [testText, setTestText] = useState('Hello from Kasparex dApps!');
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState({ name: 'Test dApp', version: '1.0.0' });
  
  const { upload, uploadJSON, isUploading, error: uploadError, hash } = useIPFSUpload();
  // Only fetch when we have a hash (don't auto-fetch on mount)
  const { data: retrievedData, isLoading: isLoadingData, error: retrieveError, refetch } = useIPFSContent(uploadedHash || null);

  const handleTextUpload = async () => {
    const blob = new Blob([testText], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    const cid = await upload(file, { filename: 'test.txt', pin: true });
    if (cid) {
      setUploadedHash(cid);
    }
  };

  const handleJSONUpload = async () => {
    const cid = await uploadJSON(jsonData, { pin: true });
    if (cid) {
      setUploadedHash(cid);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              IPFS Integration Test
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Test your Pinata IPFS integration
            </p>
          </div>

          {/* Status */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Connection Status
            </h2>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-zinc-600 dark:text-zinc-400">
                  API Key: Configured (check .env.local)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-zinc-600 dark:text-zinc-400">
                  API Secret: Configured (check .env.local)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Note: Environment variables are checked at build time. If you just added them, restart the dev server.
              </p>
            </div>
          </div>

          {/* Text Upload Test */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Test 1: Upload Text File
            </h2>
            <div className="space-y-4">
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                rows={4}
                placeholder="Enter text to upload..."
              />
              <button
                onClick={handleTextUpload}
                disabled={isUploading || !testText.trim()}
                className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload to IPFS'}
              </button>
              {hash && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Uploaded! CID: <code className="font-mono text-xs">{hash}</code>
                  </p>
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
            </div>
          </div>

          {/* JSON Upload Test */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Test 2: Upload JSON Metadata
            </h2>
            <div className="space-y-4">
              <textarea
                value={JSON.stringify(jsonData, null, 2)}
                onChange={(e) => {
                  try {
                    setJsonData(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                rows={6}
                placeholder='{"name": "Test", "version": "1.0.0"}'
              />
              <button
                onClick={handleJSONUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload JSON to IPFS'}
              </button>
            </div>
          </div>

          {/* Retrieve Test */}
          {uploadedHash && (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Test 3: Retrieve from IPFS
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">CID:</p>
                  <code className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    {uploadedHash}
                  </code>
                </div>
                <button
                  onClick={() => refetch()}
                  className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded transition-colors mb-2"
                >
                  Retrieve Content
                </button>
                {isLoadingData ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
                ) : retrievedData ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      ✅ Retrieved successfully!
                    </p>
                    <pre className="text-xs bg-white dark:bg-zinc-900 p-2 rounded overflow-auto">
                      {JSON.stringify(retrievedData, null, 2)}
                    </pre>
                  </div>
                ) : retrieveError ? (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      ❌ Error: {retrieveError.message}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Error Display */}
          {uploadError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                Upload Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {uploadError.message}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                Check your API keys in .env.local and make sure they're correct.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              💡 What to test:
            </h3>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Upload a text file and verify you get a CID</li>
              <li>Upload JSON metadata (like dApp metadata)</li>
              <li>Retrieve the uploaded content using the CID</li>
              <li>Check your Pinata dashboard to see the pinned files</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

