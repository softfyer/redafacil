
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { CheckCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/dashboard/AppHeader';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUserData } = useUser();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      if (refreshUserData) {
        refreshUserData().then(() => {
          // Redirect to dashboard after a short delay to allow the user to see the success message
          setTimeout(() => {
            router.push('/student/dashboard');
          }, 3000);
        });
      } else {
        setTimeout(() => {
            router.push('/student/dashboard');
        }, 3000);
      }
    } else {
      // If there is no session ID, redirect to the dashboard immediately
      router.push('/student/dashboard');
    }
  }, [sessionId, refreshUserData, router]);

  if (!sessionId) {
    return null; // Or a loading/redirecting message
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader title="Pagamento Aprovado" />
      <main className="flex-1 flex flex-col justify-center items-center p-4 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">
          Pagamento Realizado com Sucesso!
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Seus créditos foram adicionados à sua conta. Você será redirecionado
          para o seu dashboard em breve.
        </p>
        <Loader2 className="h-8 w-8 animate-spin text-primary mt-8" />
      </main>
    </div>
  );
}
