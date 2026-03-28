import { Suspense } from 'react';
import { MangaContent } from './components/MangaContent';

export const dynamic = 'force-static';

const MangaDetailPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0a]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-800 border-t-violet-500" />
        </div>
      }
    >
      <MangaContent />
    </Suspense>
  );
};

export default MangaDetailPage;
