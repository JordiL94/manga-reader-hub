// src/app/sw.ts
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// This declares the global types for the service worker
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // The manifest injected by Next.js during the build process
  precacheEntries: self.__SW_MANIFEST || [],
  // Forces the waiting service worker to become the active one immediately
  skipWaiting: true,
  // Immediately controls all open clients (tabs) without needing a reload
  clientsClaim: true,
  // Enables navigation preload for faster perceived performance
  navigationPreload: true,
  // Uses Serwist's recommended default caching strategies for Next.js App Router
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
