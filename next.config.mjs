/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pino-pretty"],
  
  // Cloudflare Pages configuration
  // Force static export for Cloudflare Pages builds
  // Always enable static export when building (Cloudflare Pages requirement)
  output: 'export',
  
  // Skip API routes during static export (they need to be moved to Cloudflare Workers)
  // API routes are not supported in static export mode
  skipTrailingSlashRedirect: true,
  
  // Disable image optimization for static export (Cloudflare handles this)
  images: {
    unoptimized: true,
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
    ],
  },
  
  // Disable webpack cache for Cloudflare Pages (prevents large cache files)
  // Cache files can exceed Cloudflare's 25 MiB file size limit
  webpack: (config, { isServer, webpack, dev }) => {
    // Disable webpack cache in production builds to prevent large cache files
    // Cloudflare Pages has a 25 MiB file size limit
    if (!dev) {
      config.cache = false;
    }
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
      
      // Provide a mock for indexedDB global during SSR
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof indexedDB': JSON.stringify('undefined'),
        })
      );
    }
    
    // Ignore Hardhat-related files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Ignore .sol and .ts files in scripts, contracts, and test directories
    // BUT NOT src/lib/contracts (which contains our React hooks)
    config.module.rules.push({
      test: /\.(sol|ts)$/,
      include: [
        /scripts/,
        /^contracts\//,  // Only match contracts/ at root, not src/lib/contracts
        /test/,
        /hardhat\.config/,
      ],
      exclude: [
        /src\/lib\/contracts/,  // Explicitly exclude our hooks directory
      ],
      use: 'ignore-loader',
    });
    
    return config;
  },
  
  // Experimental: Optimize for Cloudflare Pages
  experimental: {
    // Reduce build output size
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
};

export default nextConfig;
