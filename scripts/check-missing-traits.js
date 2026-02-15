/**
 * Script to check for missing trait images
 * Compares trait values from metadata with actual files in the folders
 */

const fs = require('fs');
const path = require('path');

const TRAITS_FOLDER = path.join(__dirname, '../public/nft/PIXELKREX/Pixelkrex traits');

// Map trait types to folder names
const FOLDER_MAP = {
  'Background': 'BACKGROUNDS',
  'Backgrounds': 'BACKGROUNDS',
  'Base': 'BASE',
  'Skin': 'BASE', // Skin maps to BASE
  'Clothing': 'CLOTHING',
  'Outfits': 'CLOTHING',
  'Diamonds': 'DIAMONDS',
  'Diamond': 'DIAMONDS',
  'Eyewear': 'EYEWEAR',
  'Hats': 'HATS',
  'Hat': 'HATS',
  'Headphones': 'HEADPHONES',
  'Masks': 'MASKS',
  'Mask': 'MASKS',
  'Mouth': 'MOUTH',
  'Noses': 'NOSES',
  'Nose': 'NOSES',
};

// Normalize trait value (same logic as PFPBuilder)
function normalizeTraitValue(value, traitType) {
  let normalized = String(value).trim();
  const traitTypeLower = traitType.toLowerCase().trim();
  
  // Strip long descriptions for Diamonds
  if (traitTypeLower.includes('diamond')) {
    const dashIndex = normalized.search(/\s*[–\u2014]\s+/);
    if (dashIndex > 0) {
      const afterDash = normalized.substring(dashIndex).trim();
      if (afterDash.length > 20) {
        normalized = normalized.substring(0, dashIndex).trim();
      }
    }
    const hyphenIndex = normalized.search(/\s+-\s+/);
    if (hyphenIndex > 0) {
      const afterHyphen = normalized.substring(hyphenIndex + 2).trim();
      if (afterHyphen.length > 20) {
        normalized = normalized.substring(0, hyphenIndex).trim();
      }
    }
  }
  
  // Strip trait type suffixes
  if (traitTypeLower.includes('skin')) {
    normalized = normalized.replace(/\s+skin$/i, '');
  } else if (traitTypeLower.includes('mask')) {
    normalized = normalized.replace(/\s+masks?$/i, '');
  } else if (traitTypeLower.includes('hat') || traitTypeLower.includes('hats')) {
    normalized = normalized.replace(/\s+hats?$/i, '');
  } else if (traitTypeLower.includes('eyewear')) {
    normalized = normalized.replace(/\s+eyewear$/i, '');
  } else if (traitTypeLower.includes('mouth')) {
    normalized = normalized.replace(/\s+mouth$/i, '');
  } else if (traitTypeLower.includes('background')) {
    normalized = normalized.replace(/\s+backgrounds?$/i, '');
  } else if (traitTypeLower.includes('headphone')) {
    normalized = normalized.replace(/\s+headphones?$/i, '');
  }
  
  // Normalize
  normalized = normalized
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, ' ')
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/[^\w\s_.]/g, ' ') // Don't keep hyphens
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return normalized;
}

// Get all files in a folder (case-insensitive comparison helper)
function getFilesInFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  return fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.png'))
    .map(file => file.replace('.png', '')); // Remove .png extension
}

// Check missing files
function checkMissingTraits() {
  const missing = [];
  const folders = fs.readdirSync(TRAITS_FOLDER, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log('Checking trait folders:', folders.join(', '));
  console.log('\n=== MISSING TRAIT IMAGES ===\n');
  
  // This would normally come from metadata, but for now we'll check against console examples
  // You'll need to provide the actual trait values from your metadata
  
  const testCases = [
    // Eyewear examples from console
    { type: 'Eyewear', value: 'Fruit Hack Lens - Juicy glitch remix' },
    { type: 'Eyewear', value: 'NeoDrip Visor – Neon cyan tech aesthetic' },
    { type: 'Eyewear', value: 'Codeweave – Patterned pink encryption' },
    { type: 'Eyewear', value: 'Nova Spectrum - Vibrant prismatic visor' },
    { type: 'Eyewear', value: 'Crimson Clarity - Precision red optics' },
    { type: 'Eyewear', value: 'Synth Golds – Shining legacy wear' },
    
    // Hat examples from console
    { type: 'Hat', value: 'Snapback Cap Front Green Pepe' },
    { type: 'Hat', value: 'Snapback Cap Back Dark Violet' },
    { type: 'Hat', value: 'Snapback Cap Front Cream Pink Panther' },
    { type: 'Hat', value: 'Snapback Cap Front White Pink Panther' },
    { type: 'Hat', value: 'Kaspa Winter Hat' },
    { type: 'Hat', value: 'Rainbow Hair' },
  ];
  
  for (const testCase of testCases) {
    const folderName = FOLDER_MAP[testCase.type] || testCase.type.toUpperCase();
    const folderPath = path.join(TRAITS_FOLDER, folderName);
    const files = getFilesInFolder(folderPath);
    const normalized = normalizeTraitValue(testCase.value, testCase.type);
    
    // Check if file exists (case-insensitive)
    const found = files.some(file => 
      file.toLowerCase() === normalized.toLowerCase() ||
      file === normalized
    );
    
    if (!found) {
      missing.push({
        traitType: testCase.type,
        traitValue: testCase.value,
        normalizedValue: normalized,
        folder: folderName,
        expectedFile: `${normalized}.png`,
        existingFiles: files.filter(f => 
          f.toLowerCase().includes(normalized.toLowerCase().split('_')[0]) ||
          normalized.toLowerCase().includes(f.toLowerCase().split('_')[0])
        ).slice(0, 5) // Show up to 5 similar files
      });
    }
  }
  
  if (missing.length === 0) {
    console.log('✓ All test cases found matching files!\n');
  } else {
    console.log(`Found ${missing.length} missing trait images:\n`);
    missing.forEach((item, index) => {
      console.log(`${index + 1}. ${item.traitType}: "${item.traitValue}"`);
      console.log(`   Normalized: "${item.normalizedValue}"`);
      console.log(`   Expected: ${item.folder}/${item.expectedFile}`);
      if (item.existingFiles.length > 0) {
        console.log(`   Similar files: ${item.existingFiles.join(', ')}`);
      }
      console.log('');
    });
  }
  
  return missing;
}

// Run the check
if (require.main === module) {
  checkMissingTraits();
}

module.exports = { checkMissingTraits, normalizeTraitValue };

