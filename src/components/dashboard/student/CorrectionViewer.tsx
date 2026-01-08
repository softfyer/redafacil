'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Essay } from '@/lib/services/essayService';
import { Download, Eye } from 'lucide-react'; // Importa o ícone Eye

interface CorrectionViewerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  essay: Essay | null;
}

export function CorrectionViewer({ isOpen, onOpenChange, essay }: CorrectionViewerProps) {
  if (!essay || essay.status !== 'corrected') {
    return null;
  }

  const formattedFeedback = essay.textFeedback?.replace(/\n/g, '<br />') || 'Nenhum feedback fornecido.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>Correção da Redação: {essay.title}</DialogTitle>
          <DialogDescription>
            Veja abaixo os comentários do professor e os links para seus arquivos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <h4 className="font-semibold">Detalhes da Redação:</h4>
                <p className="text-sm text-muted-foreground"><strong>Comando da redação:</strong> {essay.promptCommands}</p>
                <p className="text-sm text-muted-foreground"><strong>Exame:</strong> {essay.targetExam}</p>
                <p className="text-sm text-muted-foreground"><strong>Tipo de texto:</strong> {essay.textType}</p>
            </div>

            <h4 className="font-semibold">Feedback do Professor:</h4>
            <div 
                className="prose prose-sm max-w-none text-muted-foreground p-3 bg-stone-100 rounded-md"
                dangerouslySetInnerHTML={{ __html: formattedFeedback }}
            />

            {essay.audioFeedbackUrl && (
                <div className="space-y-2">
                    <h4 className="font-semibold">Feedback em Áudio:</h4>
                    <audio controls src={essay.audioFeedbackUrl} className="w-full">
                        Seu navegador não suporta o elemento de áudio.
                    </audio>
                </div>
            )}
        </div>

        {/* ADIÇÃO: Botões para ver arquivo original e baixar o corrigido */}
        <DialogFooter className="flex-col sm:flex-row sm:justify-start gap-2">
            {essay.fileUrl && (
                <a href={essay.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button type="button" variant="outline" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Arquivo Original
                    </Button>
                </a>
            )}
            {essay.correctedFileUrl ? (
                 <a href={essay.correctedFileUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button type="button" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Arquivo Corrigido
                    </Button>
                </a>
            ) : (
                <p className='text-sm text-red-500'>Arquivo de correção não encontrado.</p>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
