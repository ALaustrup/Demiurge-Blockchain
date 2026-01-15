/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@demiurge/qor-sdk', '@demiurge/ui-shared'],
  output: 'standalone',
  // Server Actions are enabled by default in Next.js 15
  // No need for experimental.serverActions
}

module.exports = nextConfig
