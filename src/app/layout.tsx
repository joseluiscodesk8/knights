import type { Metadata, Viewport } from "next";
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import { HeaderVisibilityProvider } from '@/components/HeaderVisibility';

import './globals.scss';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://knights-ten.vercel.app'),
  title: {
    default: 'Knights',
    template: '%s · Knights',
  },
  description: 'Juego en equipo: campaña contra los 12 caballeros de oro, en solitario o multijugador P2P.',
  applicationName: 'Knights',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'Knights',
    title: 'Knights — los 12 caballeros de oro',
    description:
      'Elige tu caballero de bronce, cruza el mapa y derrota a los 12 Gold Knights. Solo o multijugador en equipo.',
  },
  twitter: {
    card: 'summary',
    title: 'Knights',
    description:
      'Juego en solitario o multijugador contra los 12 caballeros de oro.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffd700',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <HeaderVisibilityProvider>
          <Header />
          {children}
        </HeaderVisibilityProvider>
      </body>
    </html>
  );
}