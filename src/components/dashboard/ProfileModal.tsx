'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { updatePassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import auth instance
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres.' }),
  email: z.string().email(),
});

const passwordSchema = z.object({
    password: z.string().min(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});


type ProfileModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function ProfileModal({ isOpen, onOpenChange }: ProfileModalProps) {
  const { toast } = useToast();
  const { user, userData } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'profile' | 'password'>('profile');

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
      resolver: zodResolver(passwordSchema),
      defaultValues: {
          password: '',
          confirmPassword: '',
      }
  });

  useEffect(() => {
    if (isOpen) {
      if (userData) {
        profileForm.reset({
          name: userData.name || '',
          email: userData.email || '',
        });
      }
    } else {
      setTimeout(() => setView('profile'), 300);
      passwordForm.reset();
    }
  }, [isOpen, userData, profileForm, passwordForm]);

  function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    setIsLoading(true);
    console.log(values);
    
    setTimeout(() => {
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      setIsLoading(false);
      onOpenChange(false);
    }, 1500);
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    try {
        await updatePassword(user, values.password);
        toast({
            title: 'Senha atualizada com sucesso!',
            description: 'Você será desconectado por segurança. Por favor, faça login novamente com sua nova senha.',
        });
        
        await signOut(auth);
        router.push('/login');

    } catch (error: any) {
        console.error("Password Update Error:", error);
        let description = 'Ocorreu um erro ao redefinir sua senha.';
        if (error.code === 'auth/requires-recent-login') {
            description = 'Esta operação é sensível e requer autenticação recente. Você será deslogado por segurança. Por favor, faça login novamente e tente outra vez.';
            toast({
                title: 'Login Recente Necessário',
                description,
                variant: 'destructive',
                duration: 8000, 
            });
            await signOut(auth);
            router.push('/login');
        } else {
            toast({
                title: 'Erro ao redefinir senha',
                description,
                variant: 'destructive',
            });
        }
    } finally {
        setIsLoading(false);
        onOpenChange(false); // Close the modal
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{view === 'profile' ? 'Meu Perfil' : 'Redefinir Senha'}</DialogTitle>
          <DialogDescription>
            {view === 'profile' ? 'Gerencie suas informações pessoais.' : 'Defina uma nova senha para sua conta.'}
          </DialogDescription>
        </DialogHeader>

        {view === 'profile' && (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Senha</Label>
                <Button type="button" variant="secondary" className="w-full" onClick={() => setView('password')}>Redefinir Senha</Button>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  {!isLoading && <Save className="ml-2 h-4 w-4" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {view === 'password' && (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Digite sua nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setView('profile')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

      </DialogContent>
    </Dialog>
  );
}
