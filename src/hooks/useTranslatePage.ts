import { useQuery } from '@tanstack/react-query';
import type { TranslationBox } from '@/types/manga';
import { db } from '@/lib/db';

const fileToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// We now pass the pageId down to the fetcher
async function fetchAndSaveTranslation(
  pageId: string,
  file: Blob,
  model: string
): Promise<TranslationBox[]> {
  const base64String = await fileToBase64(file);

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64String, model }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error || 'Failed to translate page');
  }

  const data = (await response.json()) as { translations: TranslationBox[] };

  // ✨ THE MAGIC HAPPENS HERE ✨
  // Save the Gemini response directly into the local database
  await db.pages.update(pageId, { translations: data.translations });

  return data.translations;
}

export function useTranslatePage(
  pageId: string | undefined,
  file: Blob | undefined,
  hasExistingTranslations: boolean,
  model: string = 'gemini-3.1-flash-lite-preview',
  isAutoTranslate: boolean = false
) {
  return useQuery({
    // Cache key now uses pageId to ensure strict separation
    queryKey: ['translation', pageId, model],

    queryFn: () => {
      if (!file || !pageId) throw new Error('Missing file or page ID');
      return fetchAndSaveTranslation(pageId, file, model);
    },

    // TanStack will only automatically fetch if:
    // 1. We have a file & ID
    // 2. Auto-translate is turned on
    // 3. The database doesn't already have translations for this page
    enabled: !!file && !!pageId && isAutoTranslate && !hasExistingTranslations,

    staleTime: Infinity,
    gcTime: Infinity,
  });
}
