/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@demiurge/qor-sdk', '@demiurge/ui-shared', '@demiurge/wallet-wasm'],
  output: 'standalone',
  // Server Actions are enabled by default in Next.js 15
  // No need for experimental.serverActions
  webpack: (config, { isServer }) => {
    // Handle WASM files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Configure WASM loader
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
}

module.exports = nextConfig
