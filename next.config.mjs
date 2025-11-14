/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,   // ✅ Show TypeScript errors
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
