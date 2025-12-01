/**
 * App Layout
 * 
 * Layout for authenticated pages including the navbar.
 */

import { Navbar } from '@/components/layout/navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

