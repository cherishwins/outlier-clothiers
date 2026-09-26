/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for the Docker image. The Dockerfile sets
  // NEXT_OUTPUT=standalone; Vercel and local builds leave it unset and are
  // unchanged.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  images: {
    unoptimized: false,
    // Every image is served from public/. No remote host is allowed: a
    // wildcard here made /_next/image fetch and re-encode any https image on
    // the internet for anyone who asked. Add a specific host if one is needed.
    remotePatterns: [],
  },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
