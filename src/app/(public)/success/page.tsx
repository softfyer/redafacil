'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 segundo

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('ID da sessão não encontrado.');
      setLoading(false);
      return;
    }

    let attempts = 0;

    async function fetchSession() {
      try {
        const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        
        if (response.status === 402) { // 'Checkout session is not complete'
          if (attempts < MAX_RETRIES) {
            attempts++;
            setTimeout(fetchSession, RETRY_DELAY);
            return;
          }
          throw new Error('Não foi possível confirmar seu pagamento a tempo.');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar dados da sessão.');
        }

        const data = await response.json();
        setSessionData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        // Only stop loading if we are not retrying
        if (!error || attempts >= MAX_RETRIES) {
           setLoading(false);
        }
      }
    }

    fetchSession();
  }, [sessionId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Card className="w-full max-w-lg mx-4 bg-gray-950 text-white">
        <CardHeader className="text-center">
           {!loading && !error && <CardTitle className="text-2xl">Pagamento Aprovado!</CardTitle>}
           {!loading && error && <CardTitle className="text-2xl">Falha na Verificação</CardTitle>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              <p>Verificando seu pagamento...</p>
            </div>
          ) : error ? (
            <div className="text-center">
               <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">Ocorreu um erro:</p>
              <p className="font-mono text-sm bg-red-100 p-2 rounded mt-2 text-red-900">{error}</p>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg mb-2">Obrigado pela sua compra!</p>
              <p className="text-gray-300">
                Seus créditos já foram adicionados via webhook, mas esta página confirma os detalhes da transação.
              </p>
              {sessionData && (
                 <div className="text-sm text-gray-400 mt-4 border-t pt-4 border-gray-700">
                    <p>ID da Transação: {sessionData.id}</p>
                 </div>
              )}
            </div>
          )}
          <Button asChild className="w-full mt-6">
            <Link href="/student/dashboard">Ir para o Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Carregando...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
