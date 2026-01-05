'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StudentEssayList } from '@/components/dashboard/student/StudentEssayList';
import { mockEssays } from '@/lib/placeholder-data';
import type { Essay } from '@/lib/placeholder-data';
import { FilePlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EssaySubmissionWizard } from '@/components/dashboard/student/EssaySubmissionWizard';

export default function StudentDashboard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [essays, setEssays] = useState<Essay[]>(mockEssays.filter(e => e.studentId === 'user-1'));
  const { toast } = useToast();
  const [essayToEdit, setEssayToEdit] = useState<Essay | null>(null);

  const handleNewEssayClick = () => {
    setEssayToEdit(null);
    setIsWizardOpen(true);
  }

  const handleEditEssayClick = (essay: Essay) => {
    setEssayToEdit(essay);
    setIsWizardOpen(true);
  }

  const handleEssaySubmit = (newEssayData: Omit<Essay, 'id' | 'studentId' | 'studentName' | 'submittedAt' | 'status'>) => {
    if (essayToEdit) {
      // Handle editing
      setEssays(prev => prev.map(e => e.id === essayToEdit.id ? { ...essayToEdit, ...newEssayData, submittedAt: new Date() } : e));
      toast({
        title: 'Redação atualizada!',
        description: 'Suas alterações foram salvas.',
      });
    } else {
      // Handle new submission
      const essayToAdd: Essay = {
          ...newEssayData,
          id: `essay-${Date.now()}`,
          studentId: 'user-1',
          studentName: 'Juliana Pereira',
          submittedAt: new Date(),
          status: 'submitted',
      };
      setEssays(prev => [essayToAdd, ...prev]);
      toast({
          title: 'Redação enviada com sucesso!',
          description: 'Aguarde a correção do professor.',
      });
    }
    
    setIsWizardOpen(false);
    setEssayToEdit(null);
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

      <StudentEssayList essays={essays} onEdit={handleEditEssayClick} />

      <EssaySubmissionWizard
        isOpen={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSubmit={handleEssaySubmit}
        essayToEdit={essayToEdit}
      />
    </div>
  );
}
