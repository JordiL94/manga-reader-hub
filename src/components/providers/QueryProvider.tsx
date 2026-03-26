'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // We use useState to ensure the QueryClient is only instantiated once per session,
  // preventing it from being thrown away and recreated on every React render.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data is considered fresh for 1 minute
            refetchOnWindowFocus: false, // Prevents aggressive refetching when switching tabs
            retry: 1, // Only retry failed requests once to avoid spamming the Gemini API
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
