#!/bin/bash
# Cloudflare Pages build script
# This script ensures API routes are excluded before building

# Run the exclude script first
node scripts/exclude-api-routes.js

# Then run the build
npm run build

