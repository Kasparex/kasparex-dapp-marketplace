'use client';

import { useState, useEffect, useRef } from 'react';
import { getCollectionById } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';

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
    // Load available traits from collection metadata
    const loadTraits = async () => {
      try {
        const metadataList = await getCollectionMetadata(collectionId);
        
        // Extract unique trait types and values from all NFTs
        const traitMap = new Map<string, Set<string | number>>();
        
        metadataList.forEach((metadata) => {
          metadata.traits.forEach((trait) => {
            const traitType = trait.trait_type;
            const value = trait.value;
            
            if (!traitMap.has(traitType)) {
              traitMap.set(traitType, new Set());
            }
            traitMap.get(traitType)!.add(value);
          });
        });

        // Convert to Map<string, string[]>
        const traits = new Map<string, string[]>();
        traitMap.forEach((values, traitType) => {
          const sortedValues = Array.from(values)
            .map((v) => String(v))
            .sort();
          traits.set(traitType, sortedValues);
        });

        setAvailableTraits(traits);
      } catch (error) {
        console.error('Error loading traits:', error);
        // Fallback to empty traits if loading fails
        setAvailableTraits(new Map());
      }
    };

    loadTraits();
  }, [collectionId]);

  useEffect(() => {
    // Generate preview when traits change
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTraits, availableTraits]);

  /**
   * Map trait type from metadata to folder name
   * Handles case-insensitive matching and common variations
   */
  const mapTraitTypeToFolder = (traitType: string): string => {
    const typeMap: Record<string, string> = {
      'background': 'BACKGROUNDS',
      'backgrounds': 'BACKGROUNDS',
      'base': 'BASE',
      'clothing': 'CLOTHING',
      'diamonds': 'DIAMONDS',
      'diamond': 'DIAMONDS',
      'eyewear': 'EYEWEAR',
      'gear': 'GEAR',
      'hats': 'HATS',
      'hat': 'HATS',
      'masks': 'MASKS',
      'mask': 'MASKS',
      'mouth': 'MOUTH',
      'noses': 'NOSES',
      'nose': 'NOSES',
    };

    // Try exact match first (case-insensitive)
    const lowerType = traitType.toLowerCase().trim();
    if (typeMap[lowerType]) {
      return typeMap[lowerType];
    }

    // Try partial match
    for (const [key, folder] of Object.entries(typeMap)) {
      if (lowerType.includes(key) || key.includes(lowerType)) {
        return folder;
      }
    }

    // Default: uppercase the trait type and replace spaces with underscores
    return traitType.toUpperCase().replace(/\s+/g, '_');
  };

  /**
   * Normalize trait value to match file name
   * Handles spaces, case sensitivity, and special characters
   */
  const normalizeTraitValue = (value: string): string => {
    // Remove leading/trailing spaces
    return String(value).trim();
  };

  /**
   * Get trait image URL (supports both local and IPFS)
   */
  const getTraitImageUrl = (traitType: string, value: string): string | null => {
    const folderName = mapTraitTypeToFolder(traitType);
    const normalizedValue = normalizeTraitValue(value);
    
    // If traitImagesBaseUri is set, use IPFS
    if (collection?.traitImagesBaseUri) {
      const cid = collection.traitImagesBaseUri.replace(/^ipfs:\/\//, '');
      // IPFS path: {baseUri}/{folderName}/{value}.png
      // Example: ipfs://bafybe.../traits/BACKGROUNDS/Aqua Mint.png
      const ipfsPath = `${cid}/${folderName}/${normalizedValue}.png`;
      return getBestGatewayUrl(ipfsPath);
    }
    
    // Otherwise, use local public folder (for testing)
    // Path: /nft/{collectionId}/traits/{folderName}/{value}.png
    return `/nft/${collectionId}/traits/${folderName}/${encodeURIComponent(normalizedValue)}.png`;
  };

  const generatePreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !collection) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 512;
    canvas.height = 512;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trait layers in order (use available trait types)
    const layerOrder = Array.from(availableTraits.keys());
    
    for (const traitType of layerOrder) {
      const selectedValue = selectedTraits.get(traitType);
      if (!selectedValue || selectedValue === 'None') continue;

      // Get IPFS URL for trait image
      const imageUrl = getTraitImageUrl(traitType, selectedValue);
      if (!imageUrl) continue;
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Required for CORS when loading from IPFS
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 10000); // 10 second timeout

          img.onload = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            console.warn(`Failed to load trait image: ${imageUrl}`, error);
            resolve(null); // Skip this layer instead of failing
          };
          
          img.src = imageUrl;
        });

        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.warn(`Error loading trait image for ${traitType}: ${selectedValue}`, error);
        // Continue with other layers even if one fails
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
        {collection?.traitImagesBaseUri ? (
          <p>
            Select traits from different categories to build your custom PFP. Use the Randomize button to generate a random combination.
            Download your creation as a PNG or save it for later. Trait images are loaded from IPFS.
          </p>
        ) : (
          <p>
            Select traits from different categories to build your custom PFP. Use the Randomize button to generate a random combination.
            Download your creation as a PNG or save it for later. Currently using local trait images from the public folder.
            <span className="block mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              To use IPFS, add <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">traitImagesBaseUri</code> to the collection configuration.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

