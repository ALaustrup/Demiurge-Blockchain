/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@demiurge/qor-sdk', '@demiurge/ui-shared'],
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
