/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@demiurge/qor-sdk', '@demiurge/ui-shared'],
  output: 'standalone',
  // Server Actions are enabled by default in Next.js 15
  // No need for experimental.serverActions
  webpack: (config, { isServer }) => {
    // Ignore wallet-wasm module if it doesn't exist (optional dependency)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@demiurge/wallet-wasm': false,
    };
    return config;
  },
}

module.exports = nextConfig
