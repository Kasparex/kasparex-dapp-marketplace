/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pino-pretty"],
  
  // Exclude Hardhat files from webpack compilation
  webpack: (config, { isServer }) => {
    // Exclude Hardhat and contract-related files from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
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
};

export default nextConfig;
