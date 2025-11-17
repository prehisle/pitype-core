import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['pitype-core/styles'] = resolve(
      __dirname,
      '../../packages/pitype-core/styles'
    );
    config.resolve.alias['pitype-core'] = resolve(
      __dirname,
      '../../packages/pitype-core/dist/index.js'
    );
    return config;
  }
};

export default nextConfig;
