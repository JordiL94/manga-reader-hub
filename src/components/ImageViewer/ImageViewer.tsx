'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import type { MangaPageData } from '@/types/manga';
import { useTranslatePage } from '@/hooks/useTranslatePage';
import TranslationOverlay from '@/components/TranslationOverlay';
import { cn } from '@/utils/cn';

function BlobImage({
  blob,
  alt,
  className,
}: {
  blob: Blob | File;
  alt: string;
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current || !blob) return;
    const objectUrl = URL.createObjectURL(blob);
    imgRef.current.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return <img ref={imgRef} alt={alt} className={className} />;
}

interface ImageViewerProps {
  pages: MangaPageData[];
  currentIndex: number;
  onIndexChange: (newIndex: number) => void;
  onClose: () => void;
}

export default function ImageViewer({
  pages,
  currentIndex,
  onIndexChange,
  onClose,
}: ImageViewerProps) {
  const currentPage = pages[currentIndex];

  const [studyMode, setStudyMode] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('defaultStudyMode') === 'true'
      : false
  );

  const aiModel =
    typeof window !== 'undefined'
      ? localStorage.getItem('geminiModel') || 'gemini-3.1-flash-lite-preview'
      : 'gemini-3.1-flash-lite-preview';

  const [isAutoTranslate, setIsAutoTranslate] = useState(false);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  const { isLoading, refetch } = useTranslatePage(
    currentPage?.id,
    currentPage?.file,
    !!currentPage?.translations?.length,
    aiModel,
    isAutoTranslate
  );

  const goToNextPage = useCallback(() => {
    if (currentIndex < pages.length - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, pages.length, onIndexChange]);

  const goToPrevPage = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setSwipeOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;

    const dragDistanceX = currentX - touchStartX;
    const dragDistanceY = currentY - touchStartY;

    if (Math.abs(dragDistanceY) > Math.abs(dragDistanceX)) return;

    setSwipeOffset(dragDistanceX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;

    const currentX = e.changedTouches[0].clientX;
    const dragDistanceX = currentX - touchStartX;

    setSwipeOffset(0);
    setTouchStartX(null);
    setTouchStartY(null);

    if (Math.abs(dragDistanceX) > 50) {
      if (dragDistanceX > 50) goToNextPage();
      if (dragDistanceX < -50) goToPrevPage();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToNextPage();
      if (e.key === 'ArrowRight') goToPrevPage();
      if (e.key === 'Escape') onClose();

      if (e.altKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          refetch().catch();
        }
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setStudyMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, onClose, refetch]);

  // --- THE SLIDING WINDOW RENDERER ---
  const renderPage = (offset: number) => {
    const targetIndex = currentIndex + offset;

    // Don't render pages that don't exist (like before page 1 or after the last page)
    if (targetIndex < 0 || targetIndex >= pages.length) return null;

    const page = pages[targetIndex];
    const isCurrent = offset === 0;

    // RTL positioning math. 2rem gap keeps them from sticking together.
    let transformX = '0';
    if (offset === 1) transformX = 'calc(-100% - 2rem)'; // Next page on the left
    if (offset === -1) transformX = 'calc(100% + 2rem)'; // Prev page on the right

    return (
      <div
        key={page.id}
        className="absolute inset-0 flex h-full w-full items-center justify-center"
        style={{ transform: `translateX(${transformX})` }}
      >
        <div className="relative flex max-w-full shadow-2xl">
          <BlobImage
            blob={page.file}
            alt={`Page ${targetIndex + 1}`}
            className="block max-h-[calc(100dvh-2rem)] max-w-full object-contain"
          />

          {/* Performance tweak: We ONLY render translations on the active center page */}
          {isCurrent && page.translations && page.translations.length > 0 && (
            <div className="absolute inset-0">
              <TranslationOverlay
                translations={page.translations}
                studyMode={studyMode}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!currentPage) return null;

  return (
    <div
      className="relative flex h-[100dvh] w-full touch-none items-center justify-center overflow-hidden bg-[#0a0a0a] p-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isLoading && (
        <div className="absolute top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#0f1115]/90 px-4 py-2 shadow-xl ring-1 ring-white/10 backdrop-blur-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <span className="text-xs font-bold tracking-wide text-violet-200">
            Translating...
          </span>
        </div>
      )}

      {/* The Master Container: Everything slides together */}
      <div
        className={cn(
          'relative h-full w-full',
          // The fast 150ms snap makes the page turn feel crisp
          touchStartX === null
            ? 'transition-transform duration-150 ease-out'
            : ''
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {renderPage(1)} {/* Render Next Page */}
        {renderPage(0)} {/* Render Current Page */}
        {renderPage(-1)} {/* Render Prev Page */}
      </div>

      <div
        className="absolute top-0 bottom-0 left-0 z-30 w-1/3 cursor-w-resize [@media(pointer:coarse)]:hidden"
        onClick={goToNextPage}
      />
      <div
        className="absolute top-0 right-0 bottom-0 z-30 w-1/3 cursor-e-resize [@media(pointer:coarse)]:hidden"
        onClick={goToPrevPage}
      />

      {/* Control Pill */}
      <div className="absolute bottom-8 z-50 flex items-center gap-2 rounded-full bg-[#0f1115]/40 p-1.5 opacity-40 backdrop-blur-md transition-all duration-200 hover:bg-[#0f1115]/90 hover:opacity-100 hover:shadow-xl">
        <button
          onClick={(e) => {
            e.stopPropagation();
            refetch();
          }}
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
