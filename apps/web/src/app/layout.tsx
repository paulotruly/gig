import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'GiG - Greed is Great | Gestão Financeira e Educação Empreendedora',
  description: 'Plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#F8FAF5] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
