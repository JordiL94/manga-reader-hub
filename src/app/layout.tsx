import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Manga Hub',
  description: 'Local manga reader with integrated AI translation',
  manifest: '/manifest.json', // Connects the PWA manifest we built earlier
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* We set a black background and white text by default to act as a dark mode canvas for reading */}
      <body className="min-h-screen bg-black text-white antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
