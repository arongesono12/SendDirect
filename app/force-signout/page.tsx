'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';

export default function ForceSignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      console.log('Forcing sign out...');
      await signOutAction();
      router.push('/login');
      router.refresh();
    };
    handleSignOut();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Cerrando sesión...</h1>
        <p className="text-muted-foreground">Estamos limpiando tu sesión para corregir el error de navegación.</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}
