'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import type { Volume, MangaPage } from '@/lib/db';
import ImageViewer from '@/components/ImageViewer/ImageViewer';
import type { MangaPageData } from '@/types/manga';

interface ReaderUIProps {
  volume: Volume;
  dbPages: MangaPage[];
  initialPage: number;
}

export const ReaderUI = ({ volume, dbPages, initialPage }: ReaderUIProps) => {
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
    router.push('/manga');
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

        {/* The Precision Scrubber UI */}
        {showScrubber && (
          <div className="flex w-64 flex-col gap-4 rounded-lg bg-[#0f1115]/95 p-4 shadow-xl ring-1 ring-white/10 backdrop-blur-md">
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
                    if (val < 1) val = 1;
                    if (val > mappedPages.length) val = mappedPages.length;
                    setCurrentPageIndex(val - 1);
                  }}
                  className="w-16 rounded bg-gray-900 px-2 py-1 text-center text-sm font-bold text-white outline-none focus:ring-2 focus:ring-violet-500 [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-gray-500">
                  / {mappedPages.length}
                </span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10" />

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
};
