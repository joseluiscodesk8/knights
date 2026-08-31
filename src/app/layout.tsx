import type { Metadata } from "next";
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';

import './globals.scss';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Knights',
  description: 'Campaña contra los 12 caballeros de oro',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}

