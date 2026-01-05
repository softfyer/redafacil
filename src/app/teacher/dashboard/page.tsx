'use client';

import { useState } from 'react';
import { TeacherEssayList } from '@/components/dashboard/teacher/TeacherEssayList';
import { CorrectionInterface } from '@/components/dashboard/teacher/CorrectionInterface';
import { CorrectedEssayList } from '@/components/dashboard/teacher/CorrectedEssayList';
import { mockEssays } from '@/lib/placeholder-data';
import type { Essay } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function TeacherDashboard() {
  const [essays, setEssays] = useState<Essay[]>(mockEssays);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const { toast } = useToast();

  const submittedEssays = essays.filter((e) => e.status === 'submitted');
  const correctedEssays = essays.filter((e) => e.status === 'corrected');

  const handleSelectEssay = (essay: Essay) => {
    setSelectedEssay(essay);
  };

  const handleCorrectionSubmit = (correctedData: Partial<Essay>) => {
    if (!selectedEssay) return;

    setEssays((prevEssays) =>
      prevEssays.map((essay) =>
        essay.id === selectedEssay.id
          ? { ...essay, ...correctedData, status: 'corrected' }
          : essay
      )
    );
    setSelectedEssay(null);
    toast({
        title: 'Correção enviada!',
        description: 'O aluno foi notificado.',
    });
  };

  const handleBackToList = () => {
    setSelectedEssay(null);
  }

  return (
    <div className="space-y-8">
      {selectedEssay ? (
        <CorrectionInterface
          essay={selectedEssay}
          onCorrectionSubmit={handleCorrectionSubmit}
          onBack={handleBackToList}
        />
      ) : (
        <div className="space-y-8">
            <TeacherEssayList
            essays={submittedEssays}
            onSelectEssay={handleSelectEssay}
            />
            <Separator />
            <CorrectedEssayList essays={correctedEssays} />
        </div>
      )}
    </div>
  );
}
