'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { importMangaFiles } from '@/lib/importer';
import DirectorySelector from '@/components/DirectorySelector';
import CoverImage from '@/components/Library/CoverImage';
import SettingsPanel from '@/components/SettingsPanel';

export default function LibraryPage() {
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // useLiveQuery handles the subscription automatically
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

  const hasMangas = mangas !== undefined && mangas.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Modernized Header Section */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Your Library
            </h1>
            {hasMangas && (
              <p className="mt-1 text-sm font-medium text-gray-500">
                {mangas.length === 1 ? '1 Manga' : `${mangas.length} Mangas`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-[#16181d] text-lg text-gray-400 ring-1 ring-white/5 transition-all hover:bg-[#1f2229] hover:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              title="App Settings"
            >
              ⚙️
            </button>

            {/* The wrapper relative positioning handles the importing pulse state cleanly */}
            <div className="relative">
              <DirectorySelector onFilesSelected={handleImport} />

              {isImporting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-violet-600 font-bold text-white shadow-lg">
                  <span className="animate-pulse text-sm">Importing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {mangas === undefined && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-800 border-t-violet-500" />
          </div>
        )}

        {/* The Empty State (Only shows when library is truly empty) */}
        {mangas !== undefined && mangas.length === 0 && (
          <div className="mt-32 flex flex-col items-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#16181d] text-4xl shadow-inner ring-1 ring-white/5">
              📚
            </div>
            <h2 className="text-xl font-semibold text-gray-200">
              Your library is empty
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
              Select a manga folder using the button in the top right. Your
              files will be processed and securely stored entirely within your
              browser&apos;s local database.
            </p>
          </div>
        )}

        {/* The Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {mangas?.map((manga) => (
            <Link
              key={manga.id}
              href="/manga"
              onClick={() => {
                localStorage.setItem('activeMangaId', manga.id);
              }}
              className="group flex flex-col gap-3 outline-none"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#16181d] shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-violet-900/20 group-hover:ring-violet-500/50 group-focus-visible:ring-violet-500">
                {manga.coverImage ? (
                  <CoverImage blob={manga.coverImage} alt={manga.title} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#16181d] text-xs font-medium text-gray-600">
                    No Cover
                  </div>
                )}
              </div>
              <div className="px-1">
                {/* Tightened the typography here so it doesn't look like it's floating */}
                <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-gray-300 transition-colors group-hover:text-violet-400">
                  {manga.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}
