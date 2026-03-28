import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import './src/env';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Updated to exactly match Serwist's requested environment check
  disable: process.env.NODE_ENV !== 'production',
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // REMOVED the turbopack object entirely so Serwist can use Webpack to build the SW
};

export default withSerwist(nextConfig);
