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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Save, KeyRound, Loader2, UserCog } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { updatePassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres.' }),
});

const passwordSchema = z.object({
    password: z.string().min(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});


export default function SettingsPage() {
  const { toast } = useToast();
  const { user, userData, userRole } = useUser();
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
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
    if (userData) {
      profileForm.reset({
        name: userData.name || '',
      });
    }
  }, [userData, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }
    setIsProfileLoading(true);

    try {
        const userDocRef = doc(db, `${userRole}s`, user.uid);
        await updateDoc(userDocRef, { name: values.name });
        toast({
            title: 'Perfil atualizado!',
            description: 'Seu nome foi salvo com sucesso.',
        });
        router.push('/student/dashboard');
    } catch(error) {
        console.error("Error updating profile:", error);
        toast({
            title: 'Erro ao atualizar',
            description: 'Não foi possível salvar seu nome. Tente novamente.',
            variant: 'destructive',
        });
    } finally {
        setIsProfileLoading(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }

    setIsPasswordLoading(true);
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
        setIsPasswordLoading(false);
    }
  }


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <UserCog className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <CardTitle>Configurações de Perfil</CardTitle>
                        <CardDescription>Atualize seu nome de exibição.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
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
                     <div className="flex justify-end">
                        <Button type="submit" disabled={isProfileLoading}>
                            {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isProfileLoading ? 'Salvando...' : 'Salvar Nome'}
                        </Button>
                    </div>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Separator />

        <Card>
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <KeyRound className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <CardTitle>Alterar Senha</CardTitle>
                        <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
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
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPasswordLoading}>
                                {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPasswordLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
