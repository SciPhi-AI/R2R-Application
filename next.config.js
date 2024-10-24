module.exports = {
  reactStrictMode: false,
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_R2R_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_R2R_DEPLOYMENT_URL,
    R2R_DASHBOARD_DISABLE_TELEMETRY:
      process.env.R2R_DASHBOARD_DISABLE_TELEMETRY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_HATCHET_DASHBOARD_URL:
      process.env.NEXT_PUBLIC_HATCHET_DASHBOARD_URL,
  },
};
