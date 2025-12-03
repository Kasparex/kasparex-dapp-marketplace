#!/usr/bin/env node
/**
 * Temporarily exclude API routes from Next.js build for static export
 * This script renames the API directory during build to prevent Next.js
 * from trying to process API routes during static export
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const API_DIR_BACKUP = path.join(process.cwd(), 'src', 'app', 'api.backup');

// Check if we should exclude API routes (CF_PAGES mode or static export)
const shouldExclude = process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true' || process.env.NEXT_OUTPUT === 'export';

// Determine action based on current state
const apiExists = fs.existsSync(API_DIR);
const backupExists = fs.existsSync(API_DIR_BACKUP);

if (shouldExclude && apiExists && !backupExists) {
  // Exclude: Rename API directory to exclude it from build
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
  console.log('ℹ API routes in normal state (not excluding)');
} else {
  // Unknown state
  console.log('ℹ API routes state check complete');
}

