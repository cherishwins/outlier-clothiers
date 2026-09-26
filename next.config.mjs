/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for the Docker image. The Dockerfile sets
  // NEXT_OUTPUT=standalone; Vercel and local builds leave it unset and are
  // unchanged.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
