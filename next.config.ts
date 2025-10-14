import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Allow loading card images from Scryfall’s CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cards.scryfall.io',
        port: '',
        pathname: '/**', // required to match all paths (e.g., /art_crop/front/abc123.jpg)
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    // optional, can be removed if not using server actions or React 18+ features
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
