'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deleteUserAccount } from '@/lib/services/userService';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { signOut, getAuth } from 'firebase/auth';

export function DeleteAccountSettings() {
  const { user, userRole } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteInput, setDeleteInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !userRole) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para excluir sua conta.',
        variant: 'destructive',
      });
      return;
    }

    if (deleteInput === 'DELETE') {
      try {
        await deleteUserAccount(user.uid, userRole);
        toast({
          title: 'Conta excluída',
          description: 'Sua conta foi excluída com sucesso. Você será redirecionado.',
        });
        router.push('/'); 
      } catch (error: any) {
        console.error("Erro ao excluir a conta:", error);
        if (error.code === 'auth/requires-recent-login') {
            const auth = getAuth();
            toast({
                title: 'Login Recente Necessário',
                description: 'Esta operação é sensível e requer autenticação recente. Por segurança, você será deslogado. Por favor, faça login novamente e tente outra vez.',
                variant: 'destructive',
                duration: 9000,
            });
            await signOut(auth);
            router.push('/login');
        } else {
            toast({
              title: 'Erro ao excluir a conta',
              description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
              variant: 'destructive',
            });
        }
      }
    } else {
      toast({
        title: 'Confirmação incorreta',
        description: 'Por favor, digite "DELETE" para confirmar a exclusão.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
        <h3 className="text-lg font-medium">Excluir Conta</h3>
        <p className="text-sm text-muted-foreground mb-4">
            Esta ação é irreversível e excluirá permanentemente todos os seus dados.
        </p>
        <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Excluir minha conta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores. Para confirmar, digite <strong>DELETE</strong> abaixo.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder='DELETE'
                    className="my-4"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteInput('')}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteInput !== 'DELETE'}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Confirmar Exclusão
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
