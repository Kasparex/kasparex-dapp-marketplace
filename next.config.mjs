import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pino-pretty"],
  
  // Enable image optimization for Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.fleek.co',
      },
      {
        protocol: 'https',
        hostname: 'storacha.network',
      },
    ],
  },
  
  // Webpack configuration for Vercel
  webpack: (config, { isServer, webpack }) => {
    // Exclude Hardhat and contract-related files from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Handle indexedDB for SSR - provide a mock during server-side rendering
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'idb': false,
        'indexeddb': false,
      };
      
      // Mock indexedDB for SSR using NormalModuleReplacementPlugin
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^idb$/,
          path.resolve(__dirname, 'scripts/indexeddb-polyfill.js')
        )
      );
      
      // Inject indexedDB polyfill globally before any code runs
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `
            if (typeof globalThis !== 'undefined' && typeof globalThis.indexedDB === 'undefined') {
              globalThis.indexedDB = {
                open: () => ({ onsuccess: null, onerror: null, onupgradeneeded: null, result: null, error: null, transaction: null, readyState: 'done', source: null, abort: () => {}, continue: () => {}, continuePrimaryKey: () => {}, delete: () => {} }),
                deleteDatabase: () => ({ onsuccess: null, onerror: null, readyState: 'done' }),
                databases: () => Promise.resolve([]),
                cmp: () => 0
              };
            }
            if (typeof global !== 'undefined' && typeof global.indexedDB === 'undefined') {
              global.indexedDB = globalThis.indexedDB;
            }
          `,
          raw: true,
          entryOnly: false,
        })
      );
    }
    
    // Ignore Hardhat-related files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Ignore .sol and .ts files in scripts, contracts, test, kasparex-hub, and workers directories
    // BUT NOT src/lib/contracts (which contains our React hooks)
    config.module.rules.push({
      test: /\.(sol|ts|tsx)$/,
      include: [
        /scripts/,
        /^contracts\//,  // Only match contracts/ at root, not src/lib/contracts
        /test/,
        /hardhat\.config/,
        /kasparex-hub/,  // Exclude kasparex-hub (separate Remix project)
        /^workers\//,    // Exclude workers (Cloudflare Workers project)
      ],
      exclude: [
        /src\/lib\/contracts/,  // Explicitly exclude our hooks directory
      ],
      use: 'ignore-loader',
    });
    
    return config;
  },
  
  // Experimental optimizations
  experimental: {
    // Reduce build output size
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
};

export default nextConfig;
