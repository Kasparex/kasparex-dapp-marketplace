'use client';

import { useState, useEffect, useRef } from 'react';
import { getCollectionById } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';

interface PFPBuilderProps {
  collectionId: string;
}

export function PFPBuilder({ collectionId }: PFPBuilderProps) {
  const [selectedTraits, setSelectedTraits] = useState<Map<string, string>>(new Map());
  const [availableTraits, setAvailableTraits] = useState<Map<string, string[]>>(new Map());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Map<string, string>>(new Map()); // Cache loaded images
  const [activeTraitTab, setActiveTraitTab] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const collection = getCollectionById(collectionId);

  useEffect(() => {
    // Load available traits from collection metadata
    const loadTraits = async () => {
      try {
        const metadataList = await getCollectionMetadata(collectionId);
        
        // Extract unique trait types and values from all NFTs
        const traitMap = new Map<string, Set<string | number>>();
        
        // Filter out unnecessary traits
        const excludedTraits = new Set([
          'NFT Grid',
          'Twitter (X)',
          'Twitter',
          'YouTube',
          'TikTok',
          'Telegram',
          'Website',
          'Kasparex Records',
          'Transparent',
          'TRANSPARENT',
          'Gear',
          'GEAR',
        ]);

        metadataList.forEach((metadata) => {
          metadata.traits.forEach((trait) => {
            const traitType = trait.trait_type;
            const value = trait.value;
            
            // Skip excluded traits
            if (excludedTraits.has(traitType) || excludedTraits.has(String(value))) {
              return;
            }
            
            if (!traitMap.has(traitType)) {
              traitMap.set(traitType, new Set());
            }
            traitMap.get(traitType)!.add(value);
          });
        });

        // Convert to Map<string, string[]>
        const traits = new Map<string, string[]>();
        traitMap.forEach((values, traitType) => {
          traits.set(traitType, Array.from(values).map(String).sort());
        });

        setAvailableTraits(traits);
        // Set first trait type as active tab
        const firstTraitType = Array.from(traits.keys())[0];
        if (firstTraitType) {
          setActiveTraitTab(firstTraitType);
        }
      } catch (error) {
        console.error('Error loading traits:', error);
      }
    };

    loadTraits();
  }, [collectionId]);

  /**
   * Map trait type to folder name
   */
  const mapTraitTypeToFolder = (traitType: string): string => {
    const typeMap: Record<string, string> = {
      'background': 'BACKGROUNDS',
      'backgrounds': 'BACKGROUNDS',
      'base': 'BASE',
      'skin': 'BASE', // SKIN maps to BASE folder (no separate SKIN folder exists)
      'clothing': 'CLOTHING',
      'outfits': 'CLOTHING',
      'diamonds': 'DIAMONDS',
      'eyewear': 'EYEWEAR',
      'hats': 'HATS',
      'hat': 'HATS',
      'headphones': 'HEADPHONES',
      'masks': 'MASKS',
      'mouth': 'MOUTH',
      'noses': 'NOSES',
      'nose': 'NOSES',
    };

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
   * Converts spaces and special characters to underscores
   * Examples:
   *   "Byte Moss" -> "Byte_Moss"
   *   "Binary Soul – emotionless digital stare" -> "Binary_Soul_emotionless_digital_stare"
   *   "3D Sync – binary signal mode" -> "3D_Sync_binary_signal_mode"
   *   "Hot Pink" -> "Hot_Pink"
   *   "Brown Cigarette" -> "Brown_Cigarette"
   */
  const normalizeTraitValue = (value: string): string => {
    let normalized = String(value)
      .trim()
      // First, replace em dashes, en dashes, and other dash-like characters with spaces
      // This ensures "Binary Soul – emotionless" becomes "Binary Soul emotionless" before underscore conversion
      .replace(/[–—――‒―]/g, ' ')
      // Replace other special characters (except hyphens, underscores, dots) with spaces
      .replace(/[^\w\s\-_.]/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Trim again after space normalization
      .trim()
      // Replace spaces with underscores
      .replace(/\s/g, '_')
      // Replace multiple consecutive underscores with a single underscore
      .replace(/_+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '');
    
    return normalized;
  };

  /**
   * Get trait image URL (supports both local and IPFS)
   */
  const getTraitImageUrl = (traitType: string, value: string): string | null => {
    const folderName = mapTraitTypeToFolder(traitType);
    const normalizedValue = normalizeTraitValue(value);
    
    // Debug logging for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PFP Builder] Trait: ${traitType} = "${value}"`);
      console.log(`[PFP Builder] Folder: ${folderName}, Normalized: ${normalizedValue}`);
    }
    
    // If traitImagesBaseUri is set, use IPFS
    if (collection?.traitImagesBaseUri) {
      const cid = collection.traitImagesBaseUri.replace(/^ipfs:\/\//, '');
      // IPFS path: {baseUri}/{folderName}/{value}.png
      // Updated to work with cleaner folder structure (no "Pixelkrex traits" parent folder)
      const ipfsPath = `${cid}/${folderName}/${normalizedValue}.png`;
      const url = getBestGatewayUrl(ipfsPath);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PFP Builder] IPFS Path: ${ipfsPath}`);
        console.log(`[PFP Builder] Gateway URL: ${url}`);
      }
      
      return url;
    }
    
    // Otherwise, use local public folder (for testing)
    return `/nft/${collectionId}/Pixelkrex traits/${folderName}/${encodeURIComponent(normalizedValue)}.png`;
  };

  /**
   * Preload trait image
   */
  const preloadTraitImage = async (traitType: string, value: string): Promise<string | null> => {
    const cacheKey = `${traitType}:${value}`;
    if (loadedImages.has(cacheKey)) {
      return loadedImages.get(cacheKey)!;
    }

    const imageUrl = getTraitImageUrl(traitType, value);
    if (!imageUrl) return null;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 15000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Image load failed'));
        };
        
        img.src = imageUrl;
      });

      // Store in cache
      setLoadedImages(prev => new Map(prev).set(cacheKey, imageUrl));
      return imageUrl;
    } catch (error) {
      console.warn(`Failed to preload trait image: ${traitType}:${value}`, error);
      return null;
    }
  };

  const generatePreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !collection) return;

    setIsLoadingPreview(true);
    setImageLoadErrors(new Set());

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsLoadingPreview(false);
      return;
    }

    // Set canvas size
    canvas.width = 512;
    canvas.height = 512;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trait layers in order (use available trait types)
    const layerOrder = Array.from(availableTraits.keys());
    const errors = new Set<string>();
    
    // Load images in parallel for better performance
    const imagePromises = layerOrder.map(async (traitType) => {
      const selectedValue = selectedTraits.get(traitType);
      if (!selectedValue || selectedValue === 'None') return null;

      try {
        const imageUrl = await preloadTraitImage(traitType, selectedValue);
        if (!imageUrl) {
          const errorKey = `${traitType}:${selectedValue}`;
          errors.add(errorKey);
          return null;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
          img.onload = () => { clearTimeout(timeout); resolve(); };
          img.onerror = () => { clearTimeout(timeout); reject(new Error('Load failed')); };
          img.src = imageUrl;
        });

        return { img, traitType };
      } catch (error) {
        const errorKey = `${traitType}:${selectedValue}`;
        errors.add(errorKey);
        console.warn(`Error loading trait image for ${traitType}: ${selectedValue}`, error);
        return null;
      }
    });

    // Wait for all images to load
    const loadedImages = await Promise.all(imagePromises);
    setImageLoadErrors(errors);

    // Draw images in order
    for (const result of loadedImages) {
      if (result && result.img.complete && result.img.naturalWidth > 0) {
        ctx.drawImage(result.img, 0, 0, canvas.width, canvas.height);
      }
    }

    // Convert to data URL for preview
    setPreviewUrl(canvas.toDataURL('image/png'));
    setIsLoadingPreview(false);
  };

  // Auto-generate preview when traits change
  useEffect(() => {
    if (selectedTraits.size > 0 && availableTraits.size > 0) {
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTraits, availableTraits]);

  const handleTraitSelect = (traitType: string, value: string) => {
    setSelectedTraits(prev => {
      const newTraits = new Map(prev);
      if (value === 'None') {
        newTraits.delete(traitType);
      } else {
        newTraits.set(traitType, value);
      }
      return newTraits;
    });
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

  const traitTabs = Array.from(availableTraits.keys());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trait Selectors - Tab-based */}
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

          {/* Trait Type Tabs */}
          <div className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex overflow-x-auto">
              {traitTabs.map((traitType) => (
                <button
                  key={traitType}
                  onClick={() => setActiveTraitTab(traitType)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTraitTab === traitType
                      ? 'border-[#02abb8] text-[#02abb8]'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {traitType}
                </button>
              ))}
            </div>
          </div>

          {/* Trait Images Grid */}
          {activeTraitTab && availableTraits.has(activeTraitTab) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Select {activeTraitTab}
                </p>
                <button
                  onClick={() => handleTraitSelect(activeTraitTab, 'None')}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                {availableTraits.get(activeTraitTab)!.map((value) => {
                  const isSelected = selectedTraits.get(activeTraitTab) === value;
                  const imageUrl = getTraitImageUrl(activeTraitTab, value);
                  
                  return (
                    <button
                      key={value}
                      onClick={() => handleTraitSelect(activeTraitTab, value)}
                      className={`
                        aspect-square rounded-lg overflow-hidden border-2 transition-all relative
                        ${isSelected 
                          ? 'border-[#02abb8] ring-2 ring-[#02abb8] ring-offset-2' 
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                        }
                      `}
                      title={value}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={value}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const folderName = mapTraitTypeToFolder(activeTraitTab);
                            const normalizedValue = normalizeTraitValue(value);
                            console.error(`[PFP Builder] Failed to load image:`, {
                              traitType: activeTraitTab,
                              traitValue: value,
                              folderName,
                              normalizedValue,
                              imageUrl,
                              expectedPath: collection?.traitImagesBaseUri 
                                ? `${collection.traitImagesBaseUri.replace(/^ipfs:\/\//, '')}/${folderName}/${normalizedValue}.png`
                                : `local/${folderName}/${normalizedValue}.png`
                            });
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          onLoad={() => {
                            // Preload for preview
                            preloadTraitImage(activeTraitTab, value);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-400 text-center p-1">
                          {value}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#02abb8] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Preview
          </h3>
          <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 relative">
            {isLoadingPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-800/80 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100" />
              </div>
            )}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="PFP Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                {isLoadingPreview ? 'Loading preview...' : 'Select traits to preview'}
              </div>
            )}
            {imageLoadErrors.size > 0 && (
              <div className="absolute bottom-2 left-2 right-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                {imageLoadErrors.size} trait image(s) failed to load. Check console for details.
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
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
        {collection?.traitImagesBaseUri ? (
          <p>
            Select traits from different categories using the tabs above. Click on trait images to select them.
            Use the Randomize button to generate a random combination. Trait images are loaded from IPFS.
            {imageLoadErrors.size > 0 && (
              <span className="block mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                Some images failed to load. Check browser console for IPFS path details.
              </span>
            )}
          </p>
        ) : (
          <p>
            Select traits from different categories using the tabs above. Click on trait images to select them.
            Currently using local trait images from the public folder.
            <span className="block mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              To use IPFS, add <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">traitImagesBaseUri</code> to the collection configuration.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
