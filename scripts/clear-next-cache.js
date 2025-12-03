#!/usr/bin/env node
/**
 * Clear Next.js build cache to resolve static export detection issues
 * This script removes .next directory and related cache files
 */

const fs = require('fs');
const path = require('path');

const cacheDirs = [
  path.join(process.cwd(), '.next'),
  path.join(process.cwd(), '.next/cache'),
  path.join(process.cwd(), 'node_modules/.cache'),
];

console.log('Clearing Next.js cache...');

cacheDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✓ Removed ${dir}`);
    } catch (error) {
      console.error(`✗ Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ ${dir} does not exist, skipping`);
  }
});

console.log('Cache cleared successfully.');

