'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-admin-light to-admin-dark rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-2xl">RH</span>
        </div>
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Chargement de l'interface d'administration...</p>
      </div>
    </div>
  );
}
