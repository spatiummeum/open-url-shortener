/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  reactStrictMode: true,
  typescript: {
    // Enable TypeScript checking in development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable ESLint checking in development
    ignoreDuringBuilds: false,
  },
  // Configure experimental features for better Tailwind CSS v4 support
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
}

module.exports = nextConfig