'use client';

import { useState, useEffect } from 'react';
import { TeacherEssayList } from '@/components/dashboard/teacher/TeacherEssayList';
import { CorrectionInterface } from '@/components/dashboard/teacher/CorrectionInterface';
import { CorrectedEssayList } from '@/components/dashboard/teacher/CorrectedEssayList';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { Essay } from '@/lib/services/essayService';

export default function TeacherDashboard() {
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger re-renders
  const { toast } = useToast();

  const handleSelectEssay = (essay: Essay) => {
    setSelectedEssay(essay);
  };

  const handleCorrectionSubmit = () => {
    // When a correction is successfully submitted, we want to refresh the lists.
    toast({
        title: 'Correção enviada!',
        description: 'A redação foi marcada como corrigida e o aluno será notificado.',
    });
    setSelectedEssay(null); // Go back to the list view
    setRefreshKey(prevKey => prevKey + 1); // Trigger a refresh
  };

  const handleBackToList = () => {
    setSelectedEssay(null);
  }

  return (
    <div className="space-y-8">
      {selectedEssay ? (
        <CorrectionInterface
          essay={selectedEssay}
          onCorrectionSubmit={handleCorrectionSubmit} // Pass the new handler
          onBack={handleBackToList}
        />
      ) : (
        <div className="space-y-8" key={refreshKey}> {/* Use the key here */}
            <TeacherEssayList onSelectEssay={handleSelectEssay} />
            
            <Separator />

            {/* This component now fetches its own data and will refresh automatically */}
            <CorrectedEssayList />
        </div>
      )}
    </div>
  );
}
