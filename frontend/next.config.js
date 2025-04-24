/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  },
  // Improved Vercel deployment configuration
  distDir: '.next',
  // Specify output type for clearer Vercel deployment
  output: 'standalone',
}

module.exports = nextConfig