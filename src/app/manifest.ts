import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Manga Translator Hub',
    short_name: 'Manga Hub',
    description: 'A local manga reader with integrated AI translation',
    start_url: '/',
    display: 'standalone', // This hides the browser UI/address bar
    orientation: 'portrait', // or 'any' if you read horizontally
    background_color: '#000000', // Dark mode by default for reading
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
