/**
 * Compare Hat trait values from metadata with actual IPFS files
 * Generates a list of missing traits to add to the filter
 */

const fs = require('fs');
const path = require('path');

const HATS_FOLDER = path.join(__dirname, '../public/nft/PIXELKREX/Pixelkrex traits/HATS');

// Get all actual file names (without .png extension, lowercase)
const actualFiles = new Set(
  fs.readdirSync(HATS_FOLDER)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .map(f => f.replace(/\.png$/i, '').toLowerCase())
);

console.log('='.repeat(60));
console.log('Finding Missing Hat Traits');
console.log('='.repeat(60));
console.log(`\n📂 HATS folder: ${HATS_FOLDER}`);
console.log(`📊 Total files in folder: ${actualFiles.size}\n`);

// Normalize function (same as PFPBuilder)
function normalizeTraitValue(value, traitType) {
  let normalized = String(value).trim();
  const traitTypeLower = traitType.toLowerCase().trim();
  
  if (traitTypeLower.includes('hat') || traitTypeLower.includes('hats')) {
    const normalizedLower = normalized.toLowerCase();
    
    if (normalizedLower.includes('cap')) {
      normalized = normalized.replace(/\s+hats?$/i, '');
    } else if (normalizedLower.endsWith('hat')) {
      // Keep it
    } else {
      normalized = normalized.replace(/\s+(hats?|caps?)$/i, '');
    }
  }
  
  // Normalize spaces to underscores
  normalized = normalized
    .trim()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return normalized.toLowerCase();
}

// Test cases from console errors and common patterns
const testTraitValues = [
  // From console errors
  'Red Punk',
  'Red Winter Hat',
  'Blue Hat',
  'Pink Hat',
  'Yellow Winter Hat',
  'Neon Green Winter Hat',
  'Kaspa Winter Hat',
  'Crown',
  'Play Boy',
  'Rainbow Hair',
  'Cherry Hair',
  'Fire Hair',
  'Headband Scarf Violet',
  'Headband Scarf Khaki',
  'Headband Scarf Orange',
  // Snapback Cap variants
  'Snapback Cap Front Green Pepe',
  'Snapback Cap Back Dark Violet',
  'Snapback Cap Front Cream Pink Panther',
  'Snapback Cap Front White Pink Panther',
  'Snapback Cap Back Green Duck',
  'Snapback Cap Back Violet Pink Panther',
  'Snapback Cap Front Green',
  'Snapback Cap Front White Pepe',
  'Snapback Cap Front Red Duck',
  'Snapback Cap Back Green Pikachu',
  'Snapback Cap Back Mint Green Pikachu',
  'Snapback Cap Back Neon Green Pikachu',
  'Snapback Cap Back Lilac Pink Panther',
  'Snapback Cap Front Violet',
  'Snapback Cap Front Cream',
  'Snapback Cap Back Black Duck',
  'Snapback Cap Back Yellow Pepe',
  'Snapback Cap Front Gray',
  'Snapback Cap Front Blue Vault Boy',
  'Snapback Cap Back Green',
];

console.log('🔍 Testing trait values against actual files:\n');

const missing = [];
const found = [];

testTraitValues.forEach(value => {
  const normalized = normalizeTraitValue(value, 'Hat');
  const exists = actualFiles.has(normalized);
  
  if (exists) {
    found.push({ value, normalized });
  } else {
    missing.push({ value, normalized });
    console.log(`❌ Missing: "${value}" → normalized: "${normalized}"`);
  }
});

console.log(`\n✅ Found: ${found.length}`);
console.log(`❌ Missing: ${missing.length}\n`);

if (missing.length > 0) {
  console.log('='.repeat(60));
  console.log('📋 Missing Traits to Add to Filter:');
  console.log('='.repeat(60));
  console.log('\nAdd these to missingTraitValues array:\n');
  
  missing.forEach(({ value }) => {
    console.log(`          '${value}',`);
  });
  
  console.log('\n' + '='.repeat(60));
}

// Also show some actual files for reference
console.log('\n📁 Sample actual files in HATS folder:');
Array.from(actualFiles).slice(0, 20).forEach(f => {
  console.log(`   - ${f}`);
});




