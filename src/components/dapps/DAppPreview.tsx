'use client';

import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';

interface DAppPreviewProps {
  formData: Partial<DApp>;
}

export function DAppPreview({ formData }: DAppPreviewProps) {
  const category = getCategoryById(formData.category || 'general');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Review Your dApp
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Review all information before submitting. You can go back to edit any step.
        </p>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {formData.image && (
            <img
              src={formData.image}
              alt={formData.name}
              className="w-20 h-20 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
            />
          )}
          <div className="flex-1">
            <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {formData.name || 'Untitled dApp'}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <span className="px-2 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">
                  {category.emoji} {category.name}
                </span>
              )}
              <span className="px-2 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">
                {formData.status || 'Testnet'}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">
                {formData.network || 'Testnet'}
              </span>
              {formData.version && (
                <span className="px-2 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">
                  {formData.version}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {formData.description && (
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Description
            </h5>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{formData.description}</p>
          </div>
        )}

        {/* Utility */}
        {formData.utility && (
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Utility
            </h5>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{formData.utility}</p>
          </div>
        )}

        {/* Process */}
        {formData.process && (
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Process
            </h5>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{formData.process}</p>
          </div>
        )}

        {/* Benefits */}
        {formData.benefits && (
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Benefits
            </h5>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{formData.benefits}</p>
          </div>
        )}

        {/* Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {formData.url && (
            <div>
              <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                dApp URL
              </h5>
              <a
                href={formData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#02abb8] hover:underline break-all"
              >
                {formData.url}
              </a>
            </div>
          )}
          {formData.widgetUrl && (
            <div>
              <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Widget URL
              </h5>
              <a
                href={formData.widgetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#02abb8] hover:underline break-all"
              >
                {formData.widgetUrl}
              </a>
            </div>
          )}
        </div>

        {/* Developer Info */}
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Developer
          </h5>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            {formData.developer || 'Not specified'}
          </p>
          {formData.developerLinks && formData.developerLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.developerLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#02abb8] hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Contract Address */}
        {formData.contractAddress && (
          <div>
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Contract Address
            </h5>
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">
              {formData.contractAddress}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

