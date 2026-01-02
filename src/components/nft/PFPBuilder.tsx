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
        
        // Filter out unnecessary traits (case-insensitive)
        const excludedTraitTypes = [
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
          'Digital Signature',
          'Digital signature',
          'digital signature',
          'Created By',
          'Created by',
          'created by',
        ];
        
        // Traits that don't have corresponding image files (remove from display)
        // Based on IPFS directory listing: https://apricot-bizarre-viper-692.mypinata.cloud/ipfs/bafybeichueiciyapedscvqi2lh7h7cb3tnxm6wlfhugn464hacr6hxzheq/HATS/
        const missingTraitValues = [
          // Missing Hat traits (confirmed no files exist in IPFS)
          'Snapback Cap Front Green Pepe',
          'Snapback Cap Back Dark Violet',
          'Snapback Cap Front Cream Pink Panther',
          'Snapback Cap Front White Pink Panther',
          'Snapback Cap Back Green Duck',
          'Snapback Cap Back Violet Pink Panther',
          'Snapback Cap Front Green', // From console errors
          'Snapback Cap Front White Pepe', // From console errors
          'Snapback Cap Front Red Duck', // From console errors
          'Snapback Cap Back Green Pikachu', // From console errors
          'Snapback Cap Back Mint Green Pikachu', // From console errors
          'Snapback Cap Back Neon Green Pikachu', // From console errors
          'Snapback Cap Back Lilac Pink Panther', // From console errors
          'Snapback Cap Front Violet', // From console errors
          'Snapback Cap Front Cream', // From console errors - no file in IPFS
          'Snapback Cap Back Black Duck', // From console errors - no file in IPFS
          'Kaspa Winter Hat', // File doesn't exist, but other "Winter Hat" variants might
          'Rainbow Hair',
          'Headband Scarf Violet',
          'Headband Scarf Khaki', // From console errors
          'Cherry Hair',
          'Fire Hair',
          'Pink Hat',
          'Blue Hat', // From console errors
          'Play Boy', // From console errors
          'Red Winter Hat', // From console errors
          'Snapback Cap Back Yellow Pepe', // From console errors
          'Neon Green Winter Hat', // From console errors
          'Snapback Cap Front Gray', // From console errors
          'Snapback Cap Front Blue Vault Boy', // From console errors
          'Snapback Cap Back Green', // From console errors
          'Yellow Winter Hat', // From console errors
          'Crown', // From console errors
          'Headband Scarf Orange', // From console errors
          'Red Punk', // From console errors - no Red_Punk.png in IPFS
          // Add more missing traits as identified from console errors
        ];
        
        const excludedTraitsSet = new Set(excludedTraitTypes.map(t => t.toLowerCase()));
        const missingTraitsSet = new Set(missingTraitValues.map(t => t.toLowerCase()));

        metadataList.forEach((metadata) => {
          metadata.traits.forEach((trait) => {
            const traitType = trait.trait_type;
            const value = trait.value;
            
            // Skip excluded traits (case-insensitive check)
            const traitTypeLower = traitType.toLowerCase().trim();
            const valueLower = String(value).toLowerCase().trim();
            
            if (excludedTraitsSet.has(traitTypeLower) || excludedTraitsSet.has(valueLower)) {
              console.log(`[PFP Builder] Skipping excluded trait: ${traitType} = ${value}`);
              return;
            }
            
            // Skip traits that don't have corresponding image files
            if (missingTraitsSet.has(valueLower)) {
              console.log(`[PFP Builder] Skipping missing trait (no image file): ${traitType} = ${value}`);
              return;
            }
            
            if (!traitMap.has(traitType)) {
              traitMap.set(traitType, new Set());
            }
            traitMap.get(traitType)!.add(value);
          });
        });

        // Convert to Map<string, string[]> and filter out traits without corresponding files
        const traits = new Map<string, string[]>();
        const missingTraits: Array<{ type: string; value: string }> = [];
        
        traitMap.forEach((values, traitType) => {
          const validValues: string[] = [];
          
          values.forEach((value) => {
            const valueStr = String(value);
            const normalizedValue = normalizeTraitValue(valueStr, traitType);
            const folderName = mapTraitTypeToFolder(traitType);
            
            // Check if this trait value would result in a valid file path
            // For now, we'll include all traits and let the image loading handle missing files
            // But we can log missing ones for debugging
            validValues.push(valueStr);
          });
          
          if (validValues.length > 0) {
            traits.set(traitType, validValues.sort());
          }
        });

        setAvailableTraits(traits);
        
        // Log missing traits for user reference
        if (missingTraits.length > 0) {
          console.warn('[PFP Builder] Traits without corresponding files (consider removing from metadata):', missingTraits);
        }
        
        // Log all loaded trait types for debugging
        console.log('[PFP Builder] Loaded trait types:', Array.from(traits.keys()));
        console.log('[PFP Builder] Trait counts:', Array.from(traits.entries()).map(([type, values]) => ({
          type,
          count: values.length,
          sampleValues: values.slice(0, 3)
        })));
        
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
      'diamond': 'DIAMONDS',
      'eyewear': 'EYEWEAR',
      'hats': 'HATS',
      'hat': 'HATS',
      'headphones': 'HEADPHONES',
      'headphone': 'HEADPHONES',
      'masks': 'MASKS',
      'mask': 'MASKS',
      'mouth': 'MOUTH',
      'noses': 'NOSES',
      'nose': 'NOSES',
    };

    const lowerType = traitType.toLowerCase().trim();
    
    // Direct match
    if (typeMap[lowerType]) {
      const folder = typeMap[lowerType];
      console.log(`[PFP Builder] Mapped "${traitType}" -> "${folder}" (direct match)`);
      return folder;
    }

    // Try partial match (check if trait type contains any key or vice versa)
    for (const [key, folder] of Object.entries(typeMap)) {
      if (lowerType.includes(key) || key.includes(lowerType)) {
        console.log(`[PFP Builder] Mapped "${traitType}" -> "${folder}" (partial match with "${key}")`);
        return folder;
      }
    }

    // Default: uppercase the trait type and replace spaces with underscores
    const defaultFolder = traitType.toUpperCase().replace(/\s+/g, '_');
    console.warn(`[PFP Builder] No mapping found for "${traitType}", using default: "${defaultFolder}"`);
    return defaultFolder;
  };

  /**
   * Normalize trait value to match file name
   * Strips trait type suffix (when files don't include it) and converts spaces/special characters to underscores
   * 
   * File naming patterns observed:
   * - BASE/SKIN: Files DON'T include "Skin" (e.g., "Plasma_Pop.png") → strip "Skin"
   * - MASKS: Files DON'T include "Mask" (e.g., "Pixel_Drift.png") → strip "Mask"
   * - DIAMONDS: Files DO include "Diamond" (e.g., "Aurora_Core_Diamond.png") → keep "Diamond"
   * - HATS: Mixed - some include "Hat"/"Cap", some don't → try stripping first, files that need it will have it
   * - EYEWEAR: Files DON'T include "Eyewear" but may include "wear" → strip "Eyewear" but keep "wear"
   * - MOUTH: Files DON'T include "Mouth" → strip "Mouth"
   * - NOSES: Files DO include "Nose" (e.g., "Krex_Nose.png") → keep "Nose"
   * 
   * Examples:
   *   "Plasma Pop Skin" -> "Plasma_Pop" (removes "Skin")
   *   "Pixel Drift Mask" -> "Pixel_Drift" (removes "Mask")
   *   "Aurora Core Diamond" -> "Aurora_Core_Diamond" (keeps "Diamond")
   *   "Synth Golds Shining Legacy Wear Eyewear" -> "Synth_Golds_shining_legacy_wear" (removes "Eyewear", keeps "wear")
   *   "Binary Soul – emotionless digital stare" -> "Binary_Soul_emotionless_digital_stare"
   */
  const normalizeTraitValue = (value: string, traitType: string): string => {
    let normalized = String(value)
      .trim();
    
    const traitTypeLower = traitType.toLowerCase().trim();
    
    // Strip long descriptions that appear after " - " (common in metadata, especially Diamonds)
    // Only strip if there's a clear description pattern (long text after dash)
    // Example: "Ecliptic Flame Diamond - A rare diamond glowing..." -> "Ecliptic Flame Diamond"
    // But DON'T strip short phrases that might be part of the name (e.g., "Synth Golds – Shining legacy wear")
    if (traitTypeLower.includes('diamond')) {
      // For Diamonds, strip everything after " - " or " – " as they often have long descriptions
      const dashIndex = normalized.search(/\s*[–—]\s+/);
      if (dashIndex > 0) {
        // Check if what comes after is a long description (more than 20 chars suggests description)
        const afterDash = normalized.substring(dashIndex).trim();
        if (afterDash.length > 20) {
          normalized = normalized.substring(0, dashIndex).trim();
        }
      }
      // Also handle " - " pattern
      const hyphenIndex = normalized.search(/\s+-\s+/);
      if (hyphenIndex > 0) {
        const afterHyphen = normalized.substring(hyphenIndex + 2).trim();
        if (afterHyphen.length > 20) {
          normalized = normalized.substring(0, hyphenIndex).trim();
        }
      }
    }
    
    // Trait-specific suffix stripping rules based on actual file naming patterns
    if (traitTypeLower.includes('diamond')) {
      // DIAMONDS: Files ALWAYS include "Diamond" (e.g., "Aurora_Core_Diamond.png")
      // Metadata often has: "Ecliptic Flame Diamond - A rare diamond glowing..."
      // Extract just the name part: "Ecliptic Flame Diamond"
      // DON'T strip "Diamond" suffix, but strip everything after it if there's a description
      // Example: "Ecliptic Flame Diamond - A rare diamond..." -> "Ecliptic_Flame_Diamond"
      // The description stripping above should handle this, but ensure we keep "Diamond"
    } else if (traitTypeLower.includes('skin')) {
      // BASE/SKIN: Files DON'T include "Skin" (e.g., "Plasma_Pop.png")
      // ALWAYS strip "Skin" suffix
      normalized = normalized.replace(/\s+skin$/i, '');
    } else if (traitTypeLower.includes('mask')) {
      // MASKS: Files DON'T include "Mask" (e.g., "Pixel_Drift.png", "Bitmask_Blaze.png")
      // ALWAYS strip "Mask"/"Masks" suffix
      normalized = normalized.replace(/\s+masks?$/i, '');
    } else if (traitTypeLower.includes('hat') || traitTypeLower.includes('hats')) {
      // HATS: Preserve whatever is in the metadata value
      // Don't strip "Hat" or "Cap" - let the metadata value determine the file name
      // This ensures consistency: if metadata says "Golden Digger Hat", file should be "Golden_Digger_Hat.png"
      // If metadata says "Green Stylish Hair", file should be "Green_Stylish_Hair.png"
      // 
      // The key is: file names on IPFS must match metadata values exactly (after normalization)
      // No special suffix handling - just normalize spaces/special chars to underscores
      // The general normalization below will handle the conversion to underscores
    } else if (traitTypeLower.includes('eyewear')) {
      // EYEWEAR: Files DON'T include "Eyewear" but may include "wear" (e.g., "Synth_Golds_shining_legacy_wear.png")
      // Files use mixed case: main words capitalized, descriptive text after " - " or " – " is lowercase
      // Example: "Burnline Scope - Molten techwrap design" -> "Burnline_Scope_molten_techwrap_design"
      // Example: "Parity Flash - Synced dual-tint lines" -> "Parity_Flash_synced_dual-tint_lines" (preserve hyphen in "dual-tint")
      // Strip "Eyewear" suffix
      normalized = normalized.replace(/\s+eyewear$/i, '');
      
      // For Eyewear, if there's a " - " or " – " separator, convert everything after it to lowercase
      // This matches the file naming pattern where descriptive text is lowercase
      // Check for both regular hyphen and em dash separators
      let separatorIndex = normalized.search(/\s+-\s+/);
      let separatorLength = 3; // Length of " - "
      
      if (separatorIndex < 0) {
        // Try em dash (en dash or em dash)
        const emDashMatch = normalized.match(/\s+[–—]\s+/);
        if (emDashMatch && emDashMatch.index !== undefined) {
          separatorIndex = emDashMatch.index;
          separatorLength = emDashMatch[0].length;
        }
      }
      
      if (separatorIndex >= 0) {
        const mainPart = normalized.substring(0, separatorIndex);
        const descPart = normalized.substring(separatorIndex + separatorLength).toLowerCase();
        normalized = `${mainPart} ${descPart}`;
        console.log(`[PFP Builder] Eyewear lowercase conversion: "${value}" -> main: "${mainPart}", desc: "${descPart}" -> "${normalized}"`);
      } else {
        console.log(`[PFP Builder] Eyewear no separator found in: "${normalized}"`);
      }
    } else if (traitTypeLower.includes('nose')) {
      // NOSES: Files DO include "Nose" (e.g., "Krex_Nose.png")
      // DON'T strip "Nose" suffix - keep it as-is
      // Example: "Krex Nose" -> "Krex_Nose"
    } else if (traitTypeLower.includes('mouth')) {
      // MOUTH: Files DON'T include "Mouth" (e.g., "Binary_Grin.png", "Byte_Beam.png")
      // ALWAYS strip "Mouth" suffix
      normalized = normalized.replace(/\s+mouth$/i, '');
    } else if (traitTypeLower.includes('background')) {
      // BACKGROUNDS: Files DON'T include "Background" (e.g., "Aqua_Mint.png", "Blue.png")
      // ALWAYS strip "Background"/"Backgrounds" suffix
      normalized = normalized.replace(/\s+backgrounds?$/i, '');
    } else if (traitTypeLower.includes('headphone')) {
      // HEADPHONES: Files may or may not include "Headphone" - check actual files
      // File: "Kasparex_Records.png" - doesn't have "Headphone"
      // Strip "Headphone"/"Headphones" suffix
      normalized = normalized.replace(/\s+headphones?$/i, '');
    } else {
      // For other trait types, try stripping the trait type name if it appears at the end
      const traitTypeWords = traitTypeLower.split(/\s+/);
      for (const word of traitTypeWords) {
        if (word.length > 2) { // Only strip words longer than 2 characters
          normalized = normalized.replace(new RegExp(`\\s+${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '');
        }
      }
    }
    
    // Now normalize the remaining value
    // IMPORTANT: Preserve hyphens that are part of compound words (e.g., "dual-tint", "all-black", "hex-lined")
    // These hyphens are NOT surrounded by spaces, so they remain intact
    normalized = normalized
      .trim()
      // First, replace em dashes, en dashes, and other dash-like characters with spaces
      .replace(/[–—――‒―]/g, ' ')
      // Replace " - " (hyphen with spaces - separator) with a space
      .replace(/\s+-\s+/g, ' ')
      // Replace other special characters (except hyphens, underscores, dots) with spaces
      .replace(/[^\w\s\-_.]/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Trim again after space normalization
      .trim();
    
    // Note: We DON'T convert to lowercase anymore because IPFS paths are case-sensitive
    // and files have mixed case (e.g., "Fruit_Hack_Lens" not "fruit_hack_lens")
    // The normalization preserves the original capitalization from metadata
    
    // Replace spaces with underscores
    normalized = normalized
      .replace(/\s/g, '_')
      // Replace multiple consecutive underscores with a single underscore
      .replace(/_+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '');
    
    console.log(`[PFP Builder] Normalized trait value: "${value}" (type: "${traitType}") -> "${normalized}"`);
    
    return normalized;
  };

  /**
   * Get trait image URL (supports both local and IPFS)
   */
  const getTraitImageUrl = (traitType: string, value: string): string | null => {
    const folderName = mapTraitTypeToFolder(traitType);
    const normalizedValue = normalizeTraitValue(value, traitType);
    
    // Debug logging for troubleshooting (always log for debugging)
    console.log(`[PFP Builder] Getting image URL for trait:`, {
      traitType,
      value,
      folderName,
      normalizedValue,
      originalValue: value
    });
    
    // If traitImagesBaseUri is set, use IPFS
    if (collection?.traitImagesBaseUri) {
      const cid = collection.traitImagesBaseUri.replace(/^ipfs:\/\//, '');
      // IPFS path: {baseUri}/{folderName}/{value}.png
      // Updated to work with cleaner folder structure (no "Pixelkrex traits" parent folder)
      const ipfsPath = `${cid}/${folderName}/${normalizedValue}.png`;
      const url = getBestGatewayUrl(ipfsPath);
      
      console.log(`[PFP Builder] IPFS details:`, {
        cid,
        folderName,
        normalizedValue,
        ipfsPath,
        gatewayUrl: url
      });
      
      return url;
    }
    
    // Otherwise, use local public folder (for testing)
    const localPath = `/nft/${collectionId}/Pixelkrex traits/${folderName}/${encodeURIComponent(normalizedValue)}.png`;
    console.log(`[PFP Builder] Using local path:`, localPath);
    return localPath;
  };

  /**
   * Preload trait image (works for all trait types including HATS)
   */
  const preloadTraitImage = async (traitType: string, value: string): Promise<string | null> => {
    const cacheKey = `${traitType}:${value}`;
    if (loadedImages.has(cacheKey)) {
      return loadedImages.get(cacheKey)!;
    }

    // Compute normalized value and folder name for error logging
    const normalizedValue = normalizeTraitValue(value, traitType);
    const folderName = mapTraitTypeToFolder(traitType);
    const cid = collection?.traitImagesBaseUri?.replace(/^ipfs:\/\//, '');

    // Use the same simple path construction for all traits (including HATS)
    // This ensures consistency - if normalization is correct, it will work
    const urlsToTry = [getTraitImageUrl(traitType, value)!].filter(Boolean);
    
    if (urlsToTry.length === 0) return null;

    // Try each URL variation until one works
    for (const imageUrl of urlsToTry) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 10000); // Reduced timeout for faster fallback

          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            // Log but don't show error for missing files - they're filtered out anyway
            console.warn(`[PFP Builder] Failed to load image:`, {
              traitType,
              traitValue: value,
              normalizedValue,
              folderName,
              imageUrl,
              expectedPath: cid ? `${cid}/${folderName}/${normalizedValue}.png` : undefined
            });
            reject(new Error('Image load failed'));
          };
          
          img.src = imageUrl;
        });

        // Store in cache
        console.log(`[PFP Builder] ✅ Successfully loaded: ${traitType}:${value} -> ${imageUrl}`);
        setLoadedImages(prev => new Map(prev).set(cacheKey, imageUrl));
        return imageUrl;
      } catch (error) {
        console.warn(`[PFP Builder] ❌ Failed to load ${imageUrl}:`, error);
        // Try next variation
        continue;
      }
    }

    // All variations failed
    console.warn(`[PFP Builder] ❌ All variations failed for trait: ${traitType}:${value}`);
    return null;
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
                            const normalizedValue = normalizeTraitValue(value, activeTraitTab);
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
