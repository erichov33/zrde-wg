/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,  // ✅ Show ESLint errors
  },
  typescript: {
    ignoreBuildErrors: false,   // ✅ Show TypeScript errors
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
