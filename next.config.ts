import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import './src/env';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // This explicitly tells Next.js 16 it is safe to proceed with Turbopack,
  // ignoring the Webpack config injected by the PWA plugin during dev.
  turbopack: {},
};

export default withPWA(nextConfig);
