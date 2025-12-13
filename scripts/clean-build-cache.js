#!/usr/bin/env node
/**
 * Clean build cache script for Cloudflare Pages
 * Removes cache files that exceed Cloudflare's 25 MiB file size limit
 */

const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(process.cwd(), '.next');

function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✓ Deleted: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`✗ Error deleting ${dirPath}:`, error.message);
      return false;
    }
  }
  return false;
}

function deleteFilesByPattern(dir, pattern) {
  if (!fs.existsSync(dir)) return 0;
  
  let deleted = 0;
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
    
    for (const file of files) {
      if (file.isFile() && pattern.test(file.name)) {
        const filePath = path.join(file.path || dir, file.name);
        try {
          fs.unlinkSync(filePath);
          deleted++;
        } catch (error) {
          console.warn(`Warning: Could not delete ${filePath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return deleted;
}

console.log('🧹 Cleaning build cache for Cloudflare Pages...\n');

// Remove cache directories
const cacheDirs = [
  path.join(NEXT_DIR, 'cache'),
  path.join(NEXT_DIR, 'cache', 'webpack'),
  path.join(NEXT_DIR, 'server-production'),
];

let deletedDirs = 0;
for (const dir of cacheDirs) {
  if (deleteDirectory(dir)) {
    deletedDirs++;
  }
}

// Remove large webpack cache files
const deletedFiles = deleteFilesByPattern(NEXT_DIR, /\.(pack|cache)$/);

console.log(`\n✅ Cleanup complete!`);
console.log(`   - Deleted ${deletedDirs} cache directories`);
console.log(`   - Deleted ${deletedFiles} cache files`);
console.log(`\n💡 Your build is now ready for Vercel deployment!`);

