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

async function fetchAndSaveTranslation(
  pageId: string,
  file: Blob,
  model: string
): Promise<TranslationBox[]> {
  // 1. Check for Offline Status FIRST
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('ERR_OFFLINE');
  }

  // 2. Check for the API Key
  const apiKey = localStorage.getItem('geminiApiKey');
  if (!apiKey) {
    throw new Error('ERR_MISSING_KEY');
  }

  const base64String = await fileToBase64(file);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64String, model, apiKey }),
    });

    if (!response.ok) {
      // 3. Catch Gemini Overload / Rate Limits (429 Too Many Requests, 503 Service Unavailable)
      if (response.status === 429 || response.status === 503) {
        throw new Error('ERR_API_OVERLOADED');
      }

      const errorData = (await response.json()) as { error?: string };
      throw new Error(errorData.error || 'ERR_UNKNOWN');
    }

    const data = (await response.json()) as { translations: TranslationBox[] };
    await db.pages.update(pageId, { translations: data.translations });

    return data.translations;
  } catch (error: unknown) {
    // If fetch fails entirely (e.g., DNS resolution fails while technically "online"), catch it
    if (error instanceof Error && error.message === 'Failed to fetch') {
      throw new Error('ERR_OFFLINE');
    }
    throw error;
  }
}

export function useTranslatePage(
  pageId: string | undefined,
  file: Blob | undefined,
  hasExistingTranslations: boolean,
  model: string = 'gemini-3.1-flash-lite-preview',
  isAutoTranslate: boolean = false
) {
  return useQuery({
    queryKey: ['translation', pageId, model],
    queryFn: () => {
      if (!file || !pageId) throw new Error('ERR_MISSING_DATA');
      return fetchAndSaveTranslation(pageId, file, model);
    },
    enabled: !!file && !!pageId && isAutoTranslate && !hasExistingTranslations,
    staleTime: Infinity,
    gcTime: Infinity,
    // Prevents TanStack from retrying 3 times if we intentionally threw an offline/key error
    retry: (failureCount, error) => {
      if (
        error.message === 'ERR_OFFLINE' ||
        error.message === 'ERR_MISSING_KEY'
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
