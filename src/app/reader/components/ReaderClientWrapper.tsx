'use client';

import type { ComponentType } from 'react';
import nextDynamic from 'next/dynamic';

export const ReaderClientWrapper: ComponentType = nextDynamic(
  () => import('./ReaderContent').then((mod) => mod.ReaderContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0a0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-violet-500" />
      </div>
    ),
  }
);
