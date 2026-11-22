import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'GiG - Greed is Great | Gestão Financeira e Educação Empreendedora',
  description:
    'Plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '64x64' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#F8FAF5] text-[#111827]">{children}</body>
    </html>
  );
}
