// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  serverExternalPackages: ['paydunya'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)
      config.externals = [...existing, function(ctx, callback) {
        if (ctx.request === 'paydunya' || ctx.request.startsWith('paydunya/')) {
          return callback(null, 'commonjs ' + ctx.request)
        }
        callback()
      }]
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/offline.html',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=*' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
