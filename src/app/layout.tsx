/**
 * Root Layout
 * 
 * The main layout wrapper for the entire application.
 * Sets up providers, fonts, and global styles.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'CricApp - Live Cricket Scores & Stats',
  description: 'Track live cricket matches, follow your favorite teams, and get instant notifications for match events.',
  keywords: ['cricket', 'live scores', 'IPL', 'T20', 'Test cricket', 'ODI'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

