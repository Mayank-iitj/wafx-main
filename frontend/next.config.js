/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Rewrites for local dev — in production on Vercel, NEXT_PUBLIC_API_URL
  // points to the deployed backend (Railway / Fly.io / Render).
  // The rewrite is only useful in local dev; Vercel serverless handles it via env vars.
  async rewrites() {
    // Only expose local proxy in development so that `npm run dev` works
    // without CORS configuration. In production the frontend calls the
    // backend URL directly via the env var.
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/proxy/:path*',
          destination: `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
          }/:path*`,
        },
      ];
    }
    return [];
  },

  // Allow images from any backend / avatar CDN
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // Required for standalone Docker builds — ignored by Vercel.
  // Set NEXT_OUTPUT=standalone in your Docker environment to enable.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
