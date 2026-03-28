'use client';

import { Suspense } from 'react';
import { ReaderContent } from './components/ReaderContent';

const VolumeReaderPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0a0a]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-violet-500" />
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
};

export default VolumeReaderPage;
