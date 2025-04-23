/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*'
      }
    ]
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  },
  // Optional: Configure for static export if needed
  // output: 'export',
}

module.exports = nextConfig 