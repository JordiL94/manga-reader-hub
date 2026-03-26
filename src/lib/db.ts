import Dexie, { type Table } from 'dexie';
import type { TranslationBox } from '@/types/manga';

export interface Manga {
  id: string;
  title: string;
  coverImage?: Blob;
  createdAt: number;
}

export interface Volume {
  id: string;
  mangaId: string; // Links back to the Manga
  title: string;
  createdAt: number;
}

export interface MangaPage {
  id: string;
  volumeId: string; // Links back to the Volume
  pageIndex: number;
  imageBlob: Blob; // The File object is natively a Blob, saving us conversion time
  translations?: TranslationBox[];
}

export class MangaDatabase extends Dexie {
  mangas!: Table<Manga>;
  volumes!: Table<Volume>;
  pages!: Table<MangaPage>;

  constructor() {
    super('MangaHubDB');

    // We index the foreign keys (mangaId, volumeId) so we can instantly
    // fetch all volumes for a manga, or all pages for a volume.
    // Notice we added a compound index '[mangaId+title]' to quickly check if a volume already exists.
    this.version(1).stores({
      mangas: 'id, title, createdAt',
      volumes: 'id, mangaId, [mangaId+title], createdAt',
      pages: 'id, volumeId, pageIndex',
    });
  }
}

export const db = new MangaDatabase();
