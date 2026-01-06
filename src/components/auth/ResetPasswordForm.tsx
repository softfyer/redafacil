'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um endereço de e-mail válido.' }),
});

export function ResetPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'E-mail de redefinição enviado!',
        description: `Verifique sua caixa de entrada e pasta de spam para o link de redefinição. Pode levar alguns minutos.`,
        duration: 8000,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      let message = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        message = 'Nenhuma conta encontrada com este endereço de e-mail.';
      }
      toast({
        title: 'Erro ao enviar e-mail',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
        <div className="text-center">
            <p className="text-muted-foreground">
                Se uma conta com o e-mail fornecido existir, um link de redefinição foi enviado. Por favor, verifique sua caixa de entrada e também a pasta de spam.
            </p>
            <Button variant="link" asChild className="mt-4">
                <Link href="/login">Voltar para o Login</Link>
            </Button>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail da Conta</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Enviando...' : 'Enviar e-mail de redefinição'}
        </Button>
        <p className="text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:underline">
                Lembrou a senha? Voltar para o login
            </Link>
        </p>
      </form>
    </Form>
  );
}
