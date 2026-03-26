'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { importMangaFiles } from '@/lib/importer';
import DirectorySelector from '@/components/DirectorySelector';

// --- Sub-component to safely handle Object URLs for Blobs ---
// We isolate this so each image manages its own memory cleanup,
// completely avoiding the cascading render linter errors from earlier.
function CoverImage({ blob, alt }: { blob: Blob; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const reader = new FileReader();

    reader.onload = (e) => {
      // Because this executes asynchronously after the read operation finishes,
      // the linter is perfectly happy, and we avoid synchronous cascading renders.
      if (isMounted && e.target?.result) {
        setUrl(e.target.result as string);
      }
    };

    reader.readAsDataURL(blob);

    // Cleanup function to prevent memory leaks if the component unmounts before reading finishes
    return () => {
      isMounted = false;
    };
  }, [blob]);

  if (!url) return <div className="h-full w-full animate-pulse bg-gray-800" />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}
// -----------------------------------------------------------

export default function LibraryPage() {
  const [isImporting, setIsImporting] = useState(false);

  // useLiveQuery automatically updates this array whenever the database changes
  const mangas = useLiveQuery(() =>
    db.mangas.orderBy('createdAt').reverse().toArray()
  );

  const handleImport = async (files: File[]) => {
    try {
      setIsImporting(true);
      await importMangaFiles(files);
    } catch (error) {
      console.error('Failed to import manga:', error);
      alert('Something went wrong during import. Check the console.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Your Library</h1>
            <p className="mt-2 text-gray-400">
              {mangas?.length === 1
                ? '1 Manga'
                : `${mangas?.length || 0} Mangas`}{' '}
              stored locally on your device
            </p>
          </div>

          <div className="relative">
            {/* We reuse our DirectorySelector, but now instead of just holding files in RAM, 
              it passes them to our Dexie importer. 
            */}
            <DirectorySelector onFilesSelected={handleImport} />

            {isImporting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-lg">
                <span className="animate-pulse">Importing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {mangas === undefined && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
          </div>
        )}

        {/* Empty State */}
        {mangas !== undefined && mangas.length === 0 && (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-gray-900 p-6 text-6xl shadow-inner">
              📚
            </div>
            <h2 className="text-2xl font-semibold">Your library is empty</h2>
            <p className="mt-3 max-w-md text-gray-500">
              Select a manga folder using the button above. The files will be
              processed and securely stored entirely within your browser&apos;s
              local database.
            </p>
          </div>
        )}

        {/* The Grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {mangas?.map((manga) => (
            <Link
              key={manga.id}
              href={`/manga/${manga.id}`}
              className="group flex flex-col gap-3 outline-none"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-900 shadow-md ring-1 ring-white/10 transition-all group-hover:shadow-xl group-hover:ring-blue-500/50 group-focus-visible:ring-blue-500">
                {manga.coverImage ? (
                  <CoverImage blob={manga.coverImage} alt={manga.title} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-500">
                    No Cover
                  </div>
                )}
              </div>
              <div>
                <h3 className="line-clamp-2 text-sm leading-tight font-semibold text-gray-200 group-hover:text-blue-400">
                  {manga.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
