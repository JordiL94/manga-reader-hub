'use client';

import * as React from 'react';
import { useState } from 'react';
import type { TranslationBox } from '@/types/manga';
import { cn } from '@/utils/cn';

interface TranslationOverlayProps {
  translations: TranslationBox[];
  studyMode: boolean;
}

export default function TranslationOverlay({
  translations,
  studyMode,
}: TranslationOverlayProps) {
  // Mobile touch state for Active Recall
  const [toggledBubbles, setToggledBubbles] = useState<Set<number>>(new Set());

  const handleBubbleTap = (
    index: number,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    // Prevent the tap from triggering the "Next Page" navigation underneath
    e.stopPropagation();

    if (!studyMode) return;

    setToggledBubbles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {translations.map((item, index) => {
        const [ymin, xmin, ymax, xmax] = item.box_2d;

        // Ported exactly from your MangaLens math
        const top = `${(ymin + ymax) / 20}%`;
        const left = `${(xmin + xmax) / 20}%`;
        const minHeight = `${(ymax - ymin) / 10}%`;
        const width = `${(xmax - xmin) / 10}%`;
        const maxWidth = `calc(${(xmax - xmin) / 10}% + 25px)`;

        const isToggled = toggledBubbles.has(index);

        return (
          <div
            key={index}
            className="group absolute"
            style={{
              top,
              left,
              transform: 'translate(-50%, -50%)',
              minHeight,
              width: item.type === 'sfx' ? width : undefined,
              minWidth: item.type === 'dialogue' ? '80px' : undefined,
              maxWidth: item.type === 'dialogue' ? maxWidth : undefined,
            }}
          >
            {/* The actual bubble */}
            <div
              onClick={(e) => handleBubbleTap(index, e)}
              onTouchEnd={(e) => handleBubbleTap(index, e)}
              className={cn(
                // Base styles ported from your CSS
                'pointer-events-auto flex h-full w-full cursor-pointer items-center justify-center rounded-lg border border-violet-500/50 bg-[#0f1115]/85 px-0.5 py-2 text-center text-sm font-medium break-words text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-opacity duration-200',
                // Study Mode / Active Recall Logic
                studyMode
                  ? isToggled
                    ? 'opacity-100' // Tapped on mobile
                    : 'opacity-0 lg:group-hover:opacity-100' // Hidden until hover (desktop)
                  : 'opacity-100 lg:group-hover:opacity-0' // Default mode (visible until hovered)
              )}
            >
              {item.translation}
            </div>
          </div>
        );
      })}
    </div>
  );
}
