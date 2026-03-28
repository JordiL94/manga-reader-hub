'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import type { Manga, Volume } from '@/lib/db';
import CoverImage from '@/components/Library/CoverImage';
import ConfirmModal from '@/components/ConfirmModal';

type DeletePrompt =
  | { type: 'manga' }
  | { type: 'volume'; id: string; title: string }
  | null;

interface MangaUIProps {
  manga: Manga;
  volumes: Volume[];
  mangaId: string;
}

export const MangaUI = ({ manga, volumes, mangaId }: MangaUIProps) => {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState<DeletePrompt>(null);

  const executeDelete = async () => {
    if (!deletePrompt) return;
    setIsDeleting(true);

    try {
      if (deletePrompt.type === 'manga') {
        const vols = await db.volumes
          .where('mangaId')
          .equals(mangaId)
          .toArray();
        const volumeIds = vols.map((v) => v.id);

        if (volumeIds.length > 0) {
          await db.pages.where('volumeId').anyOf(volumeIds).delete();
        }
        await db.volumes.where('mangaId').equals(mangaId).delete();
        await db.mangas.delete(mangaId);

        router.push('/');
        return;
      }

      if (deletePrompt.type === 'volume') {
        await db.pages.where('volumeId').equals(deletePrompt.id).delete();
        await db.volumes.delete(deletePrompt.id);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Error during deletion. Check console.');
    } finally {
      setIsDeleting(false);
      setDeletePrompt(null);
    }
  };

  const modalTitle =
    deletePrompt?.type === 'manga' ? 'Delete Entire Manga?' : 'Delete Volume?';

  const modalDesc =
    deletePrompt?.type === 'manga'
      ? 'This will permanently remove all volumes, pages, and cached translations for this manga from your device. You cannot undo this.'
      : `Are you sure you want to delete "${deletePrompt?.type === 'volume' ? deletePrompt.title : ''}"? This frees up storage, but you'll have to re-import it to read it again.`;

  return (
    <main className="relative min-h-[100dvh] bg-[#0a0a0a] p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="group mb-10 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-300"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-1">
            ←
          </span>
          Back to Library
        </Link>

        <div className="mb-14 flex flex-col gap-8 sm:flex-row sm:items-end">
          <div className="h-72 w-48 shrink-0 overflow-hidden rounded-md bg-[#16181d] shadow-2xl ring-1 ring-white/10">
            {manga.coverImage ? (
              <CoverImage
                blob={manga.coverImage}
                alt={manga.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
                No Cover
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end pb-2">
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
              {manga.title}
            </h1>
            <p className="mb-8 text-sm font-medium text-gray-400">
              {volumes.length} {volumes.length === 1 ? 'Volume' : 'Volumes'}
            </p>

            <button
              onClick={() => setDeletePrompt({ type: 'manga' })}
              className="w-fit rounded-md border border-gray-800 px-5 py-2 text-sm font-medium text-gray-400 transition-all hover:border-red-900/50 hover:bg-red-900/20 hover:text-red-400 focus:ring-2 focus:ring-red-500/50 focus:outline-none"
            >
              Delete Entire Manga
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-semibold text-gray-200">Volumes</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {volumes.map((volume) => (
            <Link
              key={volume.id}
              href="/reader"
              onClick={() => {
                localStorage.setItem('activeVolumeId', volume.id);
              }}
              className="group flex items-center justify-between rounded-md border border-white/5 bg-[#16181d] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-[#1f2229] hover:shadow-lg hover:shadow-violet-900/10"
            >
              <span className="mr-4 truncate font-medium text-gray-300 transition-colors group-hover:text-violet-100">
                {volume.title}
              </span>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  setDeletePrompt({
                    type: 'volume',
                    id: volume.id,
                    title: volume.title,
                  });
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-900/30 hover:text-red-400"
                title="Delete Volume"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </Link>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletePrompt}
        title={modalTitle}
        description={modalDesc}
        type="delete"
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setDeletePrompt(null)}
      />
    </main>
  );
};
