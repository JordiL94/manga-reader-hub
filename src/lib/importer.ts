import { db } from './db';

export async function importMangaFiles(files: File[]): Promise<void> {
  // 1. Filter out non-images (like .DS_Store or text files)
  const imageFiles = files.filter((f) => f.type.startsWith('image/'));

  // 2. Group the files by their folder structure
  // Structure: Map<MangaTitle, Map<VolumeTitle, File[]>>
  const libraryMap = new Map<string, Map<string, File[]>>();

  for (const file of imageFiles) {
    // webkitRelativePath looks like "Naruto/Volume 1/page_01.jpg"
    const pathParts = file.webkitRelativePath.split('/').filter(Boolean);

    let mangaTitle = 'Unknown Manga';
    let volumeTitle = 'Unknown Volume';

    // Scenario A: Nested Directory (MangaName/VolumeName/image.jpg)
    if (pathParts.length >= 3) {
      mangaTitle = pathParts[0];
      volumeTitle = pathParts[1];
    }
    // Scenario B: Flat Directory (VolumeName/image.jpg)
    else if (pathParts.length === 2) {
      volumeTitle = pathParts[0];
    }
    // (If length is 1, it's just raw images, so they stay "Unknown")

    if (!libraryMap.has(mangaTitle)) libraryMap.set(mangaTitle, new Map());
    const volumeMap = libraryMap.get(mangaTitle)!;

    if (!volumeMap.has(volumeTitle)) volumeMap.set(volumeTitle, []);
    volumeMap.get(volumeTitle)!.push(file);
  }

  // 3. Process the grouped files into IndexedDB
  for (const [mangaTitle, volumesMap] of libraryMap.entries()) {
    // Check if we already have this Manga in the library (case-insensitive check could be added later)
    let manga = await db.mangas.where('title').equals(mangaTitle).first();

    if (!manga) {
      manga = {
        id: crypto.randomUUID(),
        title: mangaTitle,
        createdAt: Date.now(),
      };
      await db.mangas.add(manga);
    }

    for (const [volumeTitle, volFiles] of volumesMap.entries()) {
      // Check if this specific volume already exists for this manga to avoid duplicates
      let volume = await db.volumes
        .where({ mangaId: manga.id, title: volumeTitle })
        .first();

      if (!volume) {
        volume = {
          id: crypto.randomUUID(),
          mangaId: manga.id,
          title: volumeTitle,
          createdAt: Date.now(),
        };
        await db.volumes.add(volume);
      } else {
        // If the volume exists, we could theoretically skip or append.
        // For now, we'll assume appending/overwriting isn't needed unless requested.
        continue;
      }

      // Sort the pages naturally
      const sortedFiles = volFiles.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );

      // Set the manga's cover image if it doesn't have one yet
      if (!manga.coverImage && sortedFiles.length > 0) {
        // We use the first page of this volume as the cover
        await db.mangas.update(manga.id, { coverImage: sortedFiles[0] });
      }

      // Prepare the pages for a massive bulk insert (much faster than looping .add())
      const pagesToInsert = sortedFiles.map((file, index) => ({
        id: crypto.randomUUID(),
        volumeId: volume!.id,
        pageIndex: index,
        imageBlob: file, // A File is just a specialized Blob, IndexedDB accepts it natively
      }));

      await db.pages.bulkAdd(pagesToInsert);
    }
  }
}
