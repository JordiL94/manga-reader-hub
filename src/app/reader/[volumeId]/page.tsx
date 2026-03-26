'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import ImageViewer from '@/components/ImageViewer';
import type { MangaPageData } from '@/types/manga';

export default function VolumeReaderPage() {
  const params = useParams<{ volumeId: string }>();
  const router = useRouter();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const volume = useLiveQuery(
    () => db.volumes.get(params.volumeId),
    [params.volumeId]
  );
  const dbPages = useLiveQuery(
    () =>
      db.pages.where('volumeId').equals(params.volumeId).sortBy('pageIndex'),
    [params.volumeId]
  );

  if (dbPages === undefined || volume === undefined) {
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
        <button
          onClick={() => router.back()}
          className="text-violet-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Look how clean this map is now without the URLs!
  const mappedPages: MangaPageData[] = dbPages.map((page) => ({
    id: page.id,
    file: page.imageBlob,
    translations: page.translations,
  }));

  const handleClose = () => {
    router.push(`/manga/${volume?.mangaId}`);
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#0a0a0a] text-white">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4 rounded bg-black/70 px-4 py-2 backdrop-blur-md">
        <span className="text-sm font-semibold text-gray-200">
          {volume?.title || 'Loading...'}
        </span>
        <div className="h-4 w-[1px] bg-gray-600" />
        <span className="text-sm font-medium text-gray-400">
          Page {currentPageIndex + 1} / {mappedPages.length}
        </span>
      </div>

      <ImageViewer
        pages={mappedPages}
        currentIndex={currentPageIndex}
        onIndexChange={setCurrentPageIndex}
      />

      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 rounded bg-red-900/70 px-4 py-2 text-sm font-semibold text-red-100 backdrop-blur-md transition-colors hover:bg-red-800"
      >
        Close
      </button>
    </div>
  );
}
