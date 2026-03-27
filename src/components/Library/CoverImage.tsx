'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface CoverImageProps {
  blob: Blob | File;
  alt: string;
  className?: string;
}

export default function CoverImage({ blob, alt, className }: CoverImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // We only execute if the img element exists
    if (!imgRef.current) return;

    // URL.createObjectURL is synchronous, instant, and vastly more
    // memory-efficient than converting a Blob to a Base64 string.
    const objectUrl = URL.createObjectURL(blob);

    // Inject it directly into the DOM node
    imgRef.current.src = objectUrl;

    // Cleanup function: revoke the URL when the component unmounts
    // to prevent browser memory leaks.
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      alt={alt}
      className={cn(
        'h-full w-full object-cover transition-transform duration-300 group-hover:scale-105',
        className
      )}
    />
  );
}
