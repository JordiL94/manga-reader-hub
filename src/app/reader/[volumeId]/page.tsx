'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
// 1. We import the strict types from your Dexie setup
import type { Volume, MangaPage } from '@/lib/db';
import ImageViewer from '@/components/ImageViewer/ImageViewer';
import type { MangaPageData } from '@/types/manga';

// --- THE WRAPPER COMPONENT ---
export default function VolumeReaderPage() {
  const params = useParams<{ volumeId: string }>();

  const volume = useLiveQuery(
    () => db.volumes.get(params.volumeId),
    [params.volumeId]
  );
  const dbPages = useLiveQuery(
    () =>
      db.pages.where('volumeId').equals(params.volumeId).sortBy('pageIndex'),
    [params.volumeId]
  );

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
}

// --- THE UI COMPONENT ---
// 2. Strict typing applied. No "any" allowed!
interface ReaderUIProps {
  volume: Volume;
  dbPages: MangaPage[];
  initialPage: number;
}

function ReaderUI({ volume, dbPages, initialPage }: ReaderUIProps) {
  const router = useRouter();

  const [currentPageIndex, setCurrentPageIndex] = useState(initialPage);
  const [showScrubber, setShowScrubber] = useState(false);

  useEffect(() => {
    db.volumes.update(volume.id, { lastReadPageIndex: currentPageIndex });
  }, [currentPageIndex, volume.id]);

  const mappedPages: MangaPageData[] = dbPages.map((page) => ({
    id: page.id,
    file: page.imageBlob,
    translations: page.translations,
  }));

  const handleClose = () => {
    router.push(`/manga/${volume.mangaId}`);
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#0a0a0a] text-white">
      {/* Top Left Indicator & Scrubber Toggle */}
      <div className="absolute top-4 left-4 z-50 flex flex-col items-start gap-2">
        <button
          onClick={() => setShowScrubber((prev) => !prev)}
          className="flex items-center gap-4 rounded bg-[#0f1115]/80 px-4 py-2 backdrop-blur-md transition-colors hover:bg-[#0f1115]"
        >
          <span className="text-sm font-semibold text-gray-200">
            {volume.title}
          </span>
          <div className="h-4 w-[1px] bg-gray-600" />
          <span className="text-sm font-medium text-gray-400">
            Page {currentPageIndex + 1} / {mappedPages.length}
          </span>
          <span className="ml-2 text-xs text-gray-500">▼</span>
        </button>

        {/* 3. The New Precision Scrubber UI */}
        {showScrubber && (
          <div className="flex w-64 flex-col gap-4 rounded-lg bg-[#0f1115]/95 p-4 shadow-xl ring-1 ring-white/10 backdrop-blur-md">
            {/* The Direct Input Field */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                Go to page:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={mappedPages.length}
                  value={currentPageIndex + 1}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) return;
                    // Clamp to min/max
                    if (val < 1) val = 1;
                    if (val > mappedPages.length) val = mappedPages.length;
                    setCurrentPageIndex(val - 1); // Convert back to 0-based index
                  }}
                  className="w-16 rounded bg-gray-900 px-2 py-1 text-center text-sm font-bold text-white outline-none focus:ring-2 focus:ring-violet-500 [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-gray-500">
                  / {mappedPages.length}
                </span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10" />

            {/* The Visual Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-gray-500">
                <span>Start</span>
                <span>End</span>
              </div>
              <input
                type="range"
                min={0}
                max={mappedPages.length - 1}
                value={currentPageIndex}
                onChange={(e) => setCurrentPageIndex(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* The Viewer */}
      <ImageViewer
        pages={mappedPages}
        currentIndex={currentPageIndex}
        onIndexChange={setCurrentPageIndex}
        onClose={handleClose}
      />

      {/* Top Right Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 rounded bg-red-900/70 px-4 py-2 text-sm font-semibold text-red-100 backdrop-blur-md transition-colors hover:bg-red-800"
      >
        Close
      </button>
    </div>
  );
}
