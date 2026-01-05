'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PaymentModal } from '@/components/dashboard/student/PaymentModal';
import { EssayUploadForm } from '@/components/dashboard/student/EssayUploadForm';
import { StudentEssayList } from '@/components/dashboard/student/StudentEssayList';
import { mockEssays } from '@/lib/placeholder-data';
import type { Essay } from '@/lib/placeholder-data';
import { FilePlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboard() {
  const [hasPaid, setHasPaid] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [essays, setEssays] = useState<Essay[]>(mockEssays.filter(e => e.studentId === 'user-1'));
  const { toast } = useToast();

  const handleOpenUpload = () => {
    if (!hasPaid) {
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setHasPaid(true);
    setIsPaymentModalOpen(false);
    toast({
        title: 'Pagamento confirmado!',
        description: 'Você já pode enviar sua redação.',
    });
  };

  const handleEssayUpload = (newEssay: Omit<Essay, 'id' | 'studentId' | 'studentName' | 'submittedAt' | 'status'>) => {
    const essayToAdd: Essay = {
        ...newEssay,
        id: `essay-${Date.now()}`,
        studentId: 'user-1',
        studentName: 'Juliana Pereira',
        submittedAt: new Date(),
        status: 'submitted',
    };
    setEssays(prev => [essayToAdd, ...prev]);
    setHasPaid(false); // Reset payment status for next upload
    toast({
        title: 'Redação enviada com sucesso!',
        description: 'Aguarde a correção do professor.',
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Nova Redação</h2>
            {!hasPaid && (
                <Button onClick={handleOpenUpload}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Enviar Nova Redação
                </Button>
            )}
        </div>
        <p className="text-muted-foreground mt-1">
            {hasPaid ? 'Preencha os dados e envie seu texto para correção.' : 'Clique no botão para adquirir um crédito e enviar uma redação.'}
        </p>
      </div>

      {hasPaid && <EssayUploadForm onUpload={handleEssayUpload} />}
      
      <StudentEssayList essays={essays} />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
