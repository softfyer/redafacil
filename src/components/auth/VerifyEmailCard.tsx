'use client';

import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MailCheck, LogOut } from 'lucide-react';

export function VerifyEmailCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleResendEmail = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'E-mail reenviado!',
        description: 'Verifique sua caixa de entrada e spam.',
      });
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reenviar o e-mail. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verifique seu E-mail</CardTitle>
          <CardDescription>
            Para continuar, por favor, confirme seu endereço de e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Enviamos um link de confirmação para{' '}
            <span className="font-medium text-foreground">{user?.email}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, clique no link para ativar sua conta. Se não encontrar o e-mail, verifique sua pasta de spam.
          </p>
          <Separator className="my-6" />
          <div className="space-y-4">
            <Button onClick={handleResendEmail} disabled={isSending} className="w-full">
                <MailCheck className="mr-2 h-4 w-4" />
                {isSending ? 'Enviando...' : 'Reenviar E-mail de Verificação'}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sair e fazer Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
