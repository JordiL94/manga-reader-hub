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

  // --- THE TRACK CAROUSEL STATE ---
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { isLoading, refetch } = useTranslatePage(
    currentPage?.id,
    currentPage?.file,
    !!currentPage?.translations?.length,
    aiModel,
    isAutoTranslate
  );

  const goToNextPage = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      setIsAnimating(true);
      onIndexChange(currentIndex + 1);
      setTimeout(() => setIsAnimating(false), 300); // Lock interactions during CSS slide
    }
  }, [currentIndex, pages.length, onIndexChange]);

  const goToPrevPage = useCallback(() => {
    if (currentIndex > 0) {
      setIsAnimating(true);
      onIndexChange(currentIndex - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [currentIndex, onIndexChange]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return; // Prevent messy multi-swiping
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setSwipeOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || isAnimating) return;

    const dragDistanceX = e.targetTouches[0].clientX - touchStartX;
    const dragDistanceY = e.targetTouches[0].clientY - touchStartY;

    if (Math.abs(dragDistanceY) > Math.abs(dragDistanceX)) return;

    setSwipeOffset(dragDistanceX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || isAnimating) return;

    const dragDistanceX = e.changedTouches[0].clientX - touchStartX;

    // Instantly reset the drag variables.
    // The CSS transition class takes over the moment touchStartX becomes null!
    setTouchStartX(null);
    setTouchStartY(null);
    setSwipeOffset(0);

    if (Math.abs(dragDistanceX) > 50) {
      if (dragDistanceX > 50) goToNextPage();
      if (dragDistanceX < -50) goToPrevPage();
    } else {
      // Didn't drag far enough, snap back to center
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
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

  if (!currentPage) return null;

  const isDragging = touchStartX !== null;

  // Track Math (RTL): Reverses the movement so swiping right goes to the next manga page
  const trackTransform = `calc(${currentIndex * 100}% + ${currentIndex * 2}rem + ${swipeOffset}px)`;

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

      {/* THE MASTER TRACK:
          If dragging, transition is off so it sticks instantly to your finger.
          The exact millisecond you let go, the 300ms transition kicks in and glides it to the new index!
      */}
      <div
        className={cn(
          'relative h-full w-full',
          isDragging
            ? 'transition-none'
            : 'transition-transform duration-300 ease-out'
        )}
        style={{ transform: `translateX(${trackTransform})` }}
      >
        {pages.map((page, index) => {
          // Optimization: Only render the current page, the previous, and the next.
          // Everything else is left out of the DOM to save massive amounts of RAM.
          if (Math.abs(index - currentIndex) > 1) return null;

          // Local position on the track (RTL: Page 1 is physically to the left of Page 0)
          const positionX = `calc(${index * -100}% - ${index * 2}rem)`;

          return (
            <div
              key={page.id} // Keys never change, meaning 0 image flicker!
              className="absolute inset-0 flex h-full w-full items-center justify-center"
              style={{ transform: `translateX(${positionX})` }}
            >
              <div className="relative flex max-w-full shadow-2xl">
                <BlobImage
                  blob={page.file}
                  alt={`Page ${index + 1}`}
                  className="block max-h-[calc(100dvh-2rem)] max-w-full object-contain"
                />

                {/* We now render translations for ALL pages in the window so they slide cleanly with the image */}
                {page.translations && page.translations.length > 0 && (
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
        })}
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
