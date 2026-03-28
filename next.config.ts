import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import './src/env';

const withSerwist = withSerwistInit({
  // This points to the file we just created
  swSrc: 'src/app/sw.ts',
  // This is where Serwist will output the compiled worker
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // This explicitly tells Next.js 16 it is safe to proceed with Turbopack,
  // ignoring the Webpack config injected by the PWA plugin during dev.
  turbopack: {},
};

export default withSerwist(nextConfig);
