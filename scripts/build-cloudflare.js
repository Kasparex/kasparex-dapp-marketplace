#!/usr/bin/env node
/**
 * Cloudflare Pages build wrapper
 * Ensures API routes are excluded before running next build
 * This works even when Cloudflare uses 'npx next build' directly
 */

const { execSync } = require('child_process');
const path = require('path');

// First, run the exclude script
console.log('Running API route exclusion...');
try {
  require(path.join(__dirname, 'exclude-api-routes.js'));
} catch (error) {
  console.error('Error excluding API routes:', error.message);
  process.exit(1);
}

// Then run next build
console.log('Running Next.js build...');
try {
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

