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

// Always exclude API routes when this script runs (it's only called from build:cloudflare)
// This script is called before and after build, so we need to check the state
const isExcluding = !fs.existsSync(API_DIR_BACKUP) && fs.existsSync(API_DIR);
const isRestoring = fs.existsSync(API_DIR_BACKUP) && !fs.existsSync(API_DIR);

if (isExcluding) {
  // Rename API directory to exclude it from build
  try {
    fs.renameSync(API_DIR, API_DIR_BACKUP);
    console.log('✓ Temporarily excluded API routes from build');
  } catch (error) {
    console.error('✗ Error excluding API routes:', error.message);
    process.exit(1);
  }
} else if (isRestoring) {
  // Restore API directory if it was backed up
  try {
    fs.renameSync(API_DIR_BACKUP, API_DIR);
    console.log('✓ Restored API routes');
  } catch (error) {
    console.error('✗ Error restoring API routes:', error.message);
  }
} else {
  // Neither state - API directory is in normal state
  console.log('ℹ API routes in normal state');
}

