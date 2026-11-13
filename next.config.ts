import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  distDir: isDev ? '.next-dev' : '.next',
  output: isCapacitorBuild ? 'export' : isDev ? undefined : 'standalone',
  trailingSlash: isCapacitorBuild ? true : false,
  reactStrictMode: false,
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    unoptimized: isCapacitorBuild ? true : false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },

  webpack: (config, {dev}) => {
    if (!dev) {
      config.cache = false;
    }
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
