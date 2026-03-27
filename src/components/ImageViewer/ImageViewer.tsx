'use client';

import { useEffect, useCallback, useState } from 'react';
import type { MangaPageData } from '@/types/manga';
import { useTranslatePage } from '@/hooks/useTranslatePage';
import TranslationOverlay from '@/components/TranslationOverlay';
import { cn } from '@/utils/cn';

// Natively handles the Blob to Base64 rendering asynchronously, avoiding linter errors
function BlobImage({
  blob,
  alt,
  className,
}: {
  blob: Blob | File;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isMounted && e.target?.result) setUrl(e.target.result as string);
    };
    reader.readAsDataURL(blob);
    return () => {
      isMounted = false;
    };
  }, [blob]);

  if (!url)
    return <div className={cn('animate-pulse bg-gray-900', className)} />;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

interface ImageViewerProps {
  pages: MangaPageData[];
  currentIndex: number;
  onIndexChange: (newIndex: number) => void;
}

export default function ImageViewer({
  pages,
  currentIndex,
  onIndexChange,
}: ImageViewerProps) {
  const currentPage = pages[currentIndex];

  const [studyMode, setStudyMode] = useState(false);
  const [isAutoTranslate, setIsAutoTranslate] = useState(false);

  // We will update this hook in the next step to talk to Dexie!
  // Hook into our Gemini API pipeline
  const { isLoading, refetch } = useTranslatePage(
    currentPage?.id,
    currentPage?.file,
    !!currentPage?.translations?.length, // Check if we already have data
    'gemini-3.1-flash-lite-preview',
    isAutoTranslate
  );

  const goToNextPage = useCallback(() => {
    if (currentIndex < pages.length - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, pages.length, onIndexChange]);

  const goToPrevPage = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToNextPage();
      if (e.key === 'ArrowRight') goToPrevPage();

      if (e.altKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          refetch();
        }
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setStudyMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, refetch]);

  if (!currentPage) return null;

  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#0a0a0a] p-4">
      {/* 1. The sleek, unobtrusive top loading indicator */}
      {isLoading && (
        <div className="absolute top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#0f1115]/90 px-4 py-2 shadow-xl ring-1 ring-white/10 backdrop-blur-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <span className="text-xs font-bold tracking-wide text-violet-200">
            Translating...
          </span>
        </div>
      )}

      <div className="relative flex max-w-full shadow-2xl">
        <BlobImage
          blob={currentPage.file}
          alt={`Page ${currentIndex + 1}`}
          className="block max-h-[calc(100dvh-2rem)] max-w-full object-contain"
        />

        {/* Removed the obstructive full-screen loader from here! */}

        {currentPage.translations && currentPage.translations.length > 0 && (
          <div className="absolute inset-0">
            <TranslationOverlay
              translations={currentPage.translations}
              studyMode={studyMode}
            />
          </div>
        )}
      </div>

      {/* Navigation Zones */}
      <div
        className="absolute top-0 bottom-0 left-0 z-30 w-1/3 cursor-w-resize"
        onClick={goToNextPage}
      />
      <div
        className="absolute top-0 right-0 bottom-0 z-30 w-1/3 cursor-e-resize"
        onClick={goToPrevPage}
      />

      {/* Control Pill */}
      <div className="absolute bottom-8 z-50 flex items-center gap-2 rounded-full bg-[#0f1115]/40 p-1.5 opacity-40 backdrop-blur-md transition-all duration-200 hover:bg-[#0f1115]/90 hover:opacity-100 hover:shadow-xl">
        <button
          onClick={(e) => {
            e.stopPropagation();
            refetch();
          }}
          // 2. The ✨ button now pulses and slightly dims when it's actively working
          className={cn(
            'rounded-full px-3 py-1.5 text-lg transition-colors',
            isLoading
              ? 'animate-pulse text-white/50'
              : 'text-white hover:bg-white/10'
          )}
          title="Translate Panel (Alt/Ctrl + T)"
          disabled={isLoading}
        >
          ✨
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setStudyMode((prev) => !prev);
          }}
          className={cn(
            'rounded-full px-3 py-1.5 text-lg transition-colors hover:bg-white/10',
            studyMode ? 'text-white/50' : 'text-white'
          )}
          title="Toggle Study Mode (Alt/Ctrl + H)"
        >
          👁️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAutoTranslate((prev) => !prev);
          }}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-white/10',
            isAutoTranslate ? 'text-violet-400' : 'text-gray-500'
          )}
          title="Toggle Auto-Translate on Page Turn"
        >
          Auto
        </button>
      </div>
    </div>
  );
}
