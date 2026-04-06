/** @type {import('next').NextConfig} */
// Set when the app is served under a subpath (e.g. GitHub Pages: /repo-name).
// Example: NEXT_PUBLIC_BASE_PATH=/pizashop-cashier-ui
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
const basePath =
  rawBase && rawBase !== '/'
    ? (rawBase.startsWith('/') ? rawBase : `/${rawBase}`).replace(/\/$/, '')
    : ''

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  ...(basePath ? { basePath } : {}),
  async rewrites() {
    return [
      // Browsers request /favicon.ico by default; we only ship /icon.svg in /public.
      { source: '/favicon.ico', destination: '/icon.svg' },
    ]
  },
}

export default nextConfig
