
'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/dashboard/AppHeader';

export default function FailurePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <AppHeader title="Pagamento Recusado" />
      <main className="flex-1 flex flex-col justify-center items-center p-4 text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">
          Falha no Pagamento
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Houve um problema ao processar seu pagamento. Nenhuma cobrança foi
          feita. Por favor, tente novamente.
        </p>
        <Button
          onClick={() => router.replace('/student/buy-credits')}
          className="mt-8"
          variant="outline"
        >
          Tentar Novamente
        </Button>
      </main>
    </div>
  );
}
