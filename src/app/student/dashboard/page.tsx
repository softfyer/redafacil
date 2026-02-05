'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { StudentEssayList } from '@/components/dashboard/student/StudentEssayList';
import { getEssaysByStudent, Essay } from '@/lib/services/essayService';
import { FilePlus2, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EssaySubmissionWizard } from '@/components/dashboard/student/EssaySubmissionWizard';
import { CorrectionViewer } from '@/components/dashboard/student/CorrectionViewer';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCorrectionViewerOpen, setIsCorrectionViewerOpen] = useState(false);
  const [essays, setEssays] = useState<Essay[]>([]);
  const { toast } = useToast();
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const { user, userData, refreshUserData } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchEssays = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const studentEssays = await getEssaysByStudent(studentId);
      setEssays(studentEssays);
    } catch (error) {
      console.error("Error fetching essays:", error);
      toast({
        title: 'Erro ao carregar redações',
        description: 'Não foi possível buscar suas redações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
        fetchEssays(user.uid);
    } else if (user === null) {
        router.push('/login');
    }
  }, [user, router, fetchEssays]);

  const handleNewEssayClick = () => {
    if (((userData as any)?.credits ?? 0) > 0) {
        setSelectedEssay(null);
        setIsWizardOpen(true);
    }
  };

  const handleEssayActionClick = (essay: Essay) => {
    setSelectedEssay(essay);
    if (essay.status === 'corrected') {
      setIsCorrectionViewerOpen(true);
    } else {
      setIsWizardOpen(true);
    }
  };

  const handleDataChange = () => {
    if (user) {
        fetchEssays(user.uid);
        refreshUserData(); // Refresh user data in context to update credits in header
    }
    setIsWizardOpen(false);
    setIsCorrectionViewerOpen(false);
  };
  
  const handleWizardClose = (isOpen: boolean) => {
      if (!isOpen) {
          setSelectedEssay(null);
      }
      setIsWizardOpen(isOpen);
  };

  if (isLoading && essays.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  const userCredits = (userData as any)?.credits ?? 0;

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold tracking-tight">Minhas Redações</h2>
                <p className="text-muted-foreground mt-1">
                    Envie sua redação para receber correções detalhadas.
                </p>
            </div>
            {userCredits > 0 ? (
                <Button onClick={handleNewEssayClick}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Enviar Nova Redação
                </Button>
            ) : (
                <Button onClick={() => router.push('/student/buy-credits')}>
                    <Coins className="mr-2 h-4 w-4" />
                    Comprar Créditos
                </Button>
            )}
        </div>

        {isLoading && essays.length === 0 ? (
          <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <StudentEssayList essays={essays} onEdit={handleEssayActionClick} />
        )}

        <EssaySubmissionWizard
          isOpen={isWizardOpen}
          onOpenChange={handleWizardClose}
          onSubmitSuccess={handleDataChange}
          essayToEdit={selectedEssay}
        />

        <CorrectionViewer 
          isOpen={isCorrectionViewerOpen}
          onOpenChange={setIsCorrectionViewerOpen}
          essay={selectedEssay}
        />
      </div>
    </div>
  );
}
