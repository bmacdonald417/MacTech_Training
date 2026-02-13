/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
    // Allow large uploads in API route handlers (e.g. PPTX import)
    proxyClientMaxBodySize: "25mb",
  },
}

module.exports = nextConfig
