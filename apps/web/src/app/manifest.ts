import type { MetadataRoute } from 'next';

// Manifesto do PWA: o Next serve este arquivo em /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'GiG - Greed is Great',
    short_name: 'GiG',
    description:
      'Gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios.',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#F8FAF5',
    theme_color: '#111827',
    categories: ['finance', 'business', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Cenários',
        url: '/#cenarios',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Transações',
        url: '/#transacoes',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
