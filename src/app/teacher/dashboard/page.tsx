'use client';

import { useState } from 'react';
import { TeacherEssayList, Essay } from '@/components/dashboard/teacher/TeacherEssayList';
import { CorrectionInterface } from '@/components/dashboard/teacher/CorrectionInterface';
import { CorrectedEssayList } from '@/components/dashboard/teacher/CorrectedEssayList';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function TeacherDashboard() {
  // State to manage which essay is currently being corrected
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const { toast } = useToast();

  // This function is passed to the list component to set the selected essay
  const handleSelectEssay = (essay: Essay) => {
    setSelectedEssay(essay);
  };

  // This function will be called when a correction is submitted
  const handleCorrectionSubmit = (correctedData: Partial<Essay>) => {
    if (!selectedEssay) return;

    // TODO: In a future step, this should update the essay in Firestore
    // and then trigger a re-fetch in the list components.

    setSelectedEssay(null); // Return to the list view
    toast({
        title: 'Correção enviada!',
        description: 'O aluno foi notificado.',
    });
  };

  // Returns from the correction view back to the main dashboard lists
  const handleBackToList = () => {
    setSelectedEssay(null);
  }

  return (
    <div className="space-y-8">
      {selectedEssay ? (
        // If an essay is selected, show the correction interface
        <CorrectionInterface
          essay={selectedEssay}
          onCorrectionSubmit={handleCorrectionSubmit}
          onBack={handleBackToList}
        />
      ) : (
        // Otherwise, show the lists of essays
        <div className="space-y-8">
            {/* 
              This component now fetches its own data.
              We just need to tell it what to do when an essay is selected.
            */}
            <TeacherEssayList onSelectEssay={handleSelectEssay} />
            
            <Separator />

            {/* 
              This component will be implemented in a future step.
              For now, it receives an empty array.
            */}
            <CorrectedEssayList essays={[]} />
        </div>
      )}
    </div>
  );
}
