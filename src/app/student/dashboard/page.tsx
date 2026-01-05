'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { StudentEssayList } from '@/components/dashboard/student/StudentEssayList';
import { getEssaysForStudent, Essay } from '@/lib/services/essayService';
import { FilePlus2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EssaySubmissionWizard } from '@/components/dashboard/student/EssaySubmissionWizard';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [essays, setEssays] = useState<Essay[]>([]);
  const { toast } = useToast();
  const [essayToEdit, setEssayToEdit] = useState<Essay | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchEssays = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const studentEssays = await getEssaysForStudent(studentId);
      setEssays(studentEssays);
    } catch (error) {
      console.error("Error fetching essays:", error);
      toast({
        title: 'Erro ao carregar redações',
        description: 'Não foi possível buscar suas redações. Se o erro persistir, pode ser necessário criar um índice no Firestore. Verifique o console para mais detalhes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchEssays(currentUser.uid);
    }
  }, [currentUser, fetchEssays]);

  const handleNewEssayClick = () => {
    setEssayToEdit(null);
    setIsWizardOpen(true);
  };

  const handleEditEssayClick = (essay: Essay) => {
    toast({
      title: 'Função ainda não implementada',
      description: 'A edição de redações será adicionada em breve.',
    });
  };

  // Handles data changes (e.g., new submission, deletion) by refetching the essay list.
  const handleDataChange = () => {
    if (currentUser) {
      fetchEssays(currentUser.uid);
    }
  };

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight">Minhas Redações</h2>
            <Button onClick={handleNewEssayClick}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Enviar Nova Redação
            </Button>
        </div>
        <p className="text-muted-foreground mt-1">
            Envie sua redação para receber correções detalhadas.
        </p>
      </div>

      {isLoading && essays.length === 0 ? (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <StudentEssayList essays={essays} onEdit={handleEditEssayClick} onDeleteSuccess={handleDataChange} />
      )}

      <EssaySubmissionWizard
        isOpen={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSubmitSuccess={handleDataChange}
        essayToEdit={essayToEdit}
      />
    </div>
  );
}
