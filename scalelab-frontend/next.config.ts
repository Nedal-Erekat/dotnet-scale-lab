import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [{ hostname: 'picsum.photos' }],
  },
}

export default nextConfig
