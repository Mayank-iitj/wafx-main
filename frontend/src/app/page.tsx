'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser().then(() => {
      if (!isLoading) {
        router.push(isAuthenticated ? '/dashboard' : '/login');
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
        <p className="text-muted-foreground text-sm">Loading WAFx...</p>
      </div>
    </div>
  );
}
