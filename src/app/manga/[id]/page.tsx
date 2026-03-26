'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

function BlobImage({
  blob,
  alt,
  className,
}: {
  blob: Blob;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isMounted && e.target?.result) setUrl(e.target.result as string);
    };
    reader.readAsDataURL(blob);
    return () => {
      isMounted = false;
    };
  }, [blob]);

  if (!url) return <div className={`animate-pulse bg-gray-800 ${className}`} />;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

export default function MangaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const manga = useLiveQuery(() => db.mangas.get(params.id), [params.id]);
  const volumes = useLiveQuery(
    () => db.volumes.where('mangaId').equals(params.id).sortBy('title'),
    [params.id]
  );

  const handleDeleteManga = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this ENTIRE manga? This will permanently remove all volumes, pages, and cached translations.'
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const vols = await db.volumes
        .where('mangaId')
        .equals(params.id)
        .toArray();
      const volumeIds = vols.map((v) => v.id);

      if (volumeIds.length > 0) {
        await db.pages.where('volumeId').anyOf(volumeIds).delete();
      }
      await db.volumes.where('mangaId').equals(params.id).delete();
      await db.mangas.delete(params.id);

      router.push('/');
    } catch (error) {
      console.error('Failed to delete manga:', error);
      alert('Error deleting manga. Check console.');
      setIsDeleting(false);
    }
  };

  // NEW: The 2-minute Volume Delete fix
  const handleDeleteVolume = async (volumeId: string, volumeTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${volumeTitle}? This frees up storage but you'll have to re-import it later to read it again.`
    );
    if (!confirmed) return;

    try {
      // 1. Nuke all pages inside this volume
      await db.pages.where('volumeId').equals(volumeId).delete();
      // 2. Nuke the volume record itself
      await db.volumes.delete(volumeId);
    } catch (error) {
      console.error('Failed to delete volume:', error);
      alert('Error deleting volume. Check console.');
    }
  };

  if (manga === undefined || volumes === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </div>
    );
  }

  if (manga === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="mb-4 text-2xl font-bold">Manga not found</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-gray-400 transition-colors hover:text-white"
        >
          ← Back to Library
        </Link>

        <div className="mb-12 flex flex-col gap-8 sm:flex-row">
          <div className="h-64 w-48 shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/10">
            {manga.coverImage ? (
              <BlobImage
                blob={manga.coverImage}
                alt={manga.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-800">
                No Cover
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {manga.title}
            </h1>
            <p className="mb-6 text-gray-400">{volumes.length} Volumes</p>

            <button
              onClick={handleDeleteManga}
              disabled={isDeleting}
              className="w-fit rounded bg-red-900/50 px-6 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-800 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Entire Manga'}
            </button>
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-semibold">Volumes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {volumes.map((volume) => (
            <div
              key={volume.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:bg-gray-800/80"
            >
              <span className="mr-4 truncate font-medium">{volume.title}</span>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleDeleteVolume(volume.id, volume.title)}
                  className="rounded-full bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-400 transition-all hover:bg-red-900/80 hover:text-red-200"
                  title="Delete Volume"
                >
                  🗑️
                </button>
                <Link
                  href={`/reader/${volume.id}`}
                  className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
                >
                  Read
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
