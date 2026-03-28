'use client';

import type { ComponentType } from 'react';
import nextDynamic from 'next/dynamic';

export const MangaClientWrapper: ComponentType = nextDynamic(
  () => import('./MangaContent').then((mod) => mod.MangaContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-800 border-t-violet-500" />
      </div>
    ),
  }
);
