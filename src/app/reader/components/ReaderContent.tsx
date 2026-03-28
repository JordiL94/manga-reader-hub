'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ReaderUI } from './ReaderUI';

export const ReaderContent = () => {
  // Direct, synchronous read.
  const volumeId =
    typeof window !== 'undefined'
      ? localStorage.getItem('activeVolumeId')
      : null;

  const volume = useLiveQuery(
    () => (volumeId ? db.volumes.get(volumeId) : undefined),
    [volumeId]
  );

  const dbPages = useLiveQuery(
    () =>
      volumeId
        ? db.pages.where('volumeId').equals(volumeId).sortBy('pageIndex')
        : [],
    [volumeId]
  );

  if (!volumeId) return null;

  if (volume === undefined || dbPages === undefined) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0a0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-violet-500" />
      </div>
    );
  }

  if (dbPages.length === 0) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="mb-4 text-2xl font-bold">
          No pages found in this volume
        </h1>
      </div>
    );
  }

  return (
    <ReaderUI
      volume={volume}
      dbPages={dbPages}
      initialPage={volume.lastReadPageIndex || 0}
    />
  );
};
