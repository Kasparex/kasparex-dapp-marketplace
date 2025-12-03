#!/usr/bin/env node
/**
 * Temporarily exclude API routes from Next.js build for static export
 * This script moves the API directory outside of src/app during build to prevent Next.js
 * from trying to process API routes during static export
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const API_DIR_BACKUP = path.join(process.cwd(), 'api-backup'); // Move outside src/app

// Check if we should exclude API routes (CF_PAGES mode or static export)
// Also check if next.config.mjs has output: 'export' configured
let shouldExclude = process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true' || process.env.NEXT_OUTPUT === 'export';

// If CF_PAGES is not set, check next.config.mjs for static export configuration
if (!shouldExclude) {
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      // Check if output: 'export' is configured (for Cloudflare Pages)
      // This handles cases where framework preset sets the build command differently
      if (configContent.includes("output:") && (configContent.includes("'export'") || configContent.includes('"export"'))) {
        shouldExclude = true;
        console.log('ℹ Detected static export configuration in next.config.mjs');
      }
    }
  } catch (error) {
    // If we can't read the config, continue with existing logic
  }
}

// Determine action based on current state
const apiExists = fs.existsSync(API_DIR);
const backupExists = fs.existsSync(API_DIR_BACKUP);

if (shouldExclude && apiExists && !backupExists) {
  // Exclude: Move API directory outside src/app to exclude it from build
  try {
    fs.renameSync(API_DIR, API_DIR_BACKUP);
    console.log('✓ Temporarily excluded API routes from build (static export mode)');
  } catch (error) {
    console.error('✗ Error excluding API routes:', error.message);
    process.exit(1);
  }
} else if (backupExists && !apiExists) {
  // Restore: API was excluded, restore it now
  try {
    fs.renameSync(API_DIR_BACKUP, API_DIR);
    console.log('✓ Restored API routes');
  } catch (error) {
    console.error('✗ Error restoring API routes:', error.message);
  }
} else if (shouldExclude && !apiExists && !backupExists) {
  // Already excluded (maybe from previous run)
  console.log('ℹ API routes already excluded');
} else if (!shouldExclude && apiExists) {
  // Normal mode, API exists
  // If backup exists from previous run, clean it up
  if (backupExists) {
    try {
      fs.rmSync(API_DIR_BACKUP, { recursive: true, force: true });
      console.log('ℹ Cleaned up old API backup directory');
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  console.log('ℹ API routes in normal state (not excluding)');
} else {
  // Unknown state
  console.log('ℹ API routes state check complete');
}

