export interface TranslationBox {
  translation: string;
  type: 'dialogue' | 'sfx';
  box_2d: [number, number, number, number];
}

export interface MangaPageData {
  id: string;
  file: Blob | File;
  // explicitly allow undefined to satisfy exactOptionalPropertyTypes
  translations?: TranslationBox[] | undefined;
}
