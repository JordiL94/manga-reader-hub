'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { MangaUI } from './MangaUI';

export const MangaContent = () => {
  // Direct, synchronous read. No extra renders needed!
  const id =
    typeof window !== 'undefined'
      ? localStorage.getItem('activeMangaId')
      : null;

  const manga = useLiveQuery(() => (id ? db.mangas.get(id) : undefined), [id]);

  const volumes = useLiveQuery(
    () => (id ? db.volumes.where('mangaId').equals(id).sortBy('title') : []),
    [id]
  );

  if (!id) return null;

  if (manga === undefined || volumes === undefined) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-800 border-t-violet-500" />
      </div>
    );
  }

  if (manga === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="mb-4 text-2xl font-bold">Manga not found</h1>
        <Link href="/" className="text-violet-500 hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  return <MangaUI manga={manga} volumes={volumes} mangaId={id} />;
};
