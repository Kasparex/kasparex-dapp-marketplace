'use client';

import { useState, useEffect, useRef } from 'react';
import { getCollectionById } from '@/lib/nft/collections';

interface PFPBuilderProps {
  collectionId: string;
}

interface TraitLayer {
  traitType: string;
  value: string;
  imagePath: string;
}

export function PFPBuilder({ collectionId }: PFPBuilderProps) {
  const [selectedTraits, setSelectedTraits] = useState<Map<string, string>>(new Map());
  const [availableTraits, setAvailableTraits] = useState<Map<string, string[]>>(new Map());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const collection = getCollectionById(collectionId);

  useEffect(() => {
    // Load available traits from public folder
    // TODO: In a real implementation, you'd scan the traits folder
    // For now, we'll use placeholder data
    const traits = new Map<string, string[]>();
    traits.set('Background', ['Blue', 'Red', 'Green', 'Purple']);
    traits.set('Body', ['Normal', 'Rare', 'Epic']);
    traits.set('Eyes', ['Normal', 'Laser', 'Glowing']);
    traits.set('Accessories', ['None', 'Hat', 'Glasses', 'Crown']);
    setAvailableTraits(traits);
  }, [collectionId]);

  useEffect(() => {
    // Generate preview when traits change
    generatePreview();
  }, [selectedTraits, availableTraits]);

  const generatePreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 512;
    canvas.height = 512;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trait layers in order
    const layerOrder = ['Background', 'Body', 'Eyes', 'Accessories'];
    
    for (const traitType of layerOrder) {
      const selectedValue = selectedTraits.get(traitType);
      if (!selectedValue || selectedValue === 'None') continue;

      // Construct image path
      const imagePath = `/nft/${collectionId}/traits/${traitType}_${selectedValue}.png`;
      
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            // If image doesn't exist, skip this layer
            resolve(null);
          };
          img.src = imagePath;
        });

        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.warn(`Failed to load trait image: ${imagePath}`, error);
      }
    }

    // Convert to data URL for preview
    setPreviewUrl(canvas.toDataURL('image/png'));
  };

  const handleTraitChange = (traitType: string, value: string) => {
    const newTraits = new Map(selectedTraits);
    if (value === 'None' || value === '') {
      newTraits.delete(traitType);
    } else {
      newTraits.set(traitType, value);
    }
    setSelectedTraits(newTraits);
  };

  const handleRandomize = () => {
    const newTraits = new Map<string, string>();
    availableTraits.forEach((values, traitType) => {
      if (values.length > 0) {
        const randomValue = values[Math.floor(Math.random() * values.length)];
        newTraits.set(traitType, randomValue);
      }
    });
    setSelectedTraits(newTraits);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${collection?.name || 'NFT'}_PFP_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSave = () => {
    // Save to localStorage
    const savedPFPs = JSON.parse(localStorage.getItem('saved_pfps') || '[]');
    const pfpData = {
      id: Date.now(),
      collection: collectionId,
      traits: Object.fromEntries(selectedTraits),
      previewUrl,
      createdAt: new Date().toISOString(),
    };
    savedPFPs.push(pfpData);
    localStorage.setItem('saved_pfps', JSON.stringify(savedPFPs));
    alert('PFP saved!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trait Selectors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Select Traits
            </h3>
            <button
              onClick={handleRandomize}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              Randomize
            </button>
          </div>

          {Array.from(availableTraits.entries()).map(([traitType, values]) => (
            <div key={traitType}>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                {traitType}
              </label>
              <select
                value={selectedTraits.get(traitType) || 'None'}
                onChange={(e) => handleTraitChange(traitType, e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="None">None</option>
                {values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Preview
          </h3>
          <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="PFP Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                Select traits to preview
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!previewUrl}
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download PNG
            </button>
            <button
              onClick={handleSave}
              disabled={!previewUrl}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Select traits from different categories to build your custom PFP. Use the Randomize button to generate a random combination.
          Download your creation as a PNG or save it for later.
        </p>
      </div>
    </div>
  );
}

