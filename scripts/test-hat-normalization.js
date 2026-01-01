/**
 * Test script to compare Hat normalization with working traits
 */

// Simulate the normalization logic from PFPBuilder.tsx
function normalizeTraitValue(value, traitType) {
  let normalized = String(value).trim();
  const traitTypeLower = traitType.toLowerCase().trim();
  
  // Hat normalization logic
  if (traitTypeLower.includes('hat') || traitTypeLower.includes('hats')) {
    const normalizedLower = normalized.toLowerCase();
    
    if (normalizedLower.includes('cap')) {
      normalized = normalized.replace(/\s+hats?$/i, '');
      console.log(`  [Hat] Contains Cap: "${value}" -> "${normalized}"`);
    } else if (normalizedLower.endsWith('hat')) {
      console.log(`  [Hat] Ends with Hat: "${value}" -> "${normalized}" (keeping)`);
    } else {
      normalized = normalized.replace(/\s+(hats?|caps?)$/i, '');
      console.log(`  [Hat] No suffix: "${value}" -> "${normalized}"`);
    }
  }
  
  // Normalize spaces to underscores (preserving case)
  normalized = normalized
    .trim()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return normalized;
}

// Test cases based on actual files
const testCases = [
  // Hat traits (from metadata examples)
  { type: 'Hat', value: 'Golden Digger Hat', expected: 'Golden_Digger_Hat' },
  { type: 'Hat', value: 'Burnt Rust Cap', expected: 'Burnt_Rust_Cap' },
  { type: 'Hat', value: 'Blue Byte', expected: 'Blue_Byte' },
  { type: 'Hat', value: 'Snapback Cap Back Violet', expected: 'Snapback_Cap_Back_Violet' },
  { type: 'Hat', value: 'Cherry Dash', expected: 'Cherry_Dash' },
  { type: 'Hat', value: 'Slime Trooper Hat', expected: 'Slime_Trooper_Hat' },
  { type: 'Hat', value: 'Core Hacker Cap', expected: 'Core_Hacker_Cap' },
  
  // Eyewear traits (working)
  { type: 'Eyewear', value: 'Donatello', expected: 'Donatello' },
  { type: 'Eyewear', value: 'Burnline Scope - Molten techwrap design', expected: 'Burnline_Scope_molten_techwrap_design' },
];

console.log('=== Testing Trait Normalization ===\n');

testCases.forEach(({ type, value, expected }) => {
  const result = normalizeTraitValue(value, type);
  const match = result === expected ? '✅' : '❌';
  console.log(`${match} ${type}: "${value}"`);
  console.log(`   Result: "${result}"`);
  console.log(`   Expected: "${expected}"`);
  if (result !== expected) {
    console.log(`   ⚠️  MISMATCH!`);
  }
  console.log('');
});

