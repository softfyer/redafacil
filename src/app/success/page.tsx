'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/dashboard/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SuccessPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session_id = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Validando seu pagamento, por favor, aguarde...');

  useEffect(() => {
    if (!session_id) {
      setStatus('error');
      setMessage('ID da sessão de pagamento não encontrado.');
      return;
    }

    const validatePayment = async () => {
      try {
        const response = await fetch('/api/validate-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id }),
        });

        // Verifica se a resposta é JSON antes de tentar fazer o parse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Ocorreu um erro ao validar o pagamento.');
          }
          setStatus('success');
          setMessage(data.message || 'Pagamento confirmado e créditos adicionados!');
        } else {
          // Se não for JSON, é um erro inesperado do servidor (provavelmente HTML)
          const errorText = await response.text();
          console.error("Server Error Response:", errorText);
          throw new Error('Ocorreu um erro inesperado no servidor. A resposta não era JSON.');
        }

      } catch (error: any) {
        setStatus('error');
        // Mostra uma mensagem mais amigável para o usuário
        setMessage(error.message.includes('inesperado') 
          ? 'Houve um problema de comunicação com o servidor. Por favor, contate o suporte se seus créditos não aparecerem em breve.'
          : error.message
        );
      }
    };

    validatePayment();
  }, [session_id]);

  const renderIcon = () => {
    switch (status) {
      case 'loading': return <LoaderCircle className="h-16 w-16 animate-spin text-primary" />;
      case 'success': return <CircleCheck className="h-16 w-16 text-green-500" />;
      case 'error': return <CircleX className="h-16 w-16 text-red-500" />;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader title="Status da Compra" />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 md:p-10 items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="items-center text-center">
            <div className="mb-4">{renderIcon()}</div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Processando Pagamento'}
              {status === 'success' && 'Pagamento Aprovado!'}
              {status === 'error' && 'Falha na Validação'}
            </CardTitle>
            <CardDescription className="pt-2">{message}</CardDescription>
          </CardHeader>
          {status !== 'loading' && (
            <CardContent className="flex flex-col items-center gap-4">
              <Button onClick={() => router.push('/student/dashboard')} className="w-full">
                Ir para o Painel
              </Button>
              {status === 'success' && (
                 <Button onClick={() => router.push('/student/payments')} className="w-full" variant="outline">
                    Ver Meus Pagamentos
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}

const SuccessPage = () => (
    <Suspense fallback={<div>Carregando...</div>}>
        <SuccessPageContent />
    </Suspense>
);

export default SuccessPage;
