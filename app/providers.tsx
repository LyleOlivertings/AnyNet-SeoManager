'use client'; // 👈 Critical: This makes it a Client Component

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      {/* We put the Toast notification system here too so it's global */}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}