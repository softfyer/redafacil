'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Essay } from '@/lib/services/essayService';
import { Download } from 'lucide-react';
import Image from 'next/image';

interface CorrectionViewerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  essay: Essay | null;
}

// Helper to check if a URL points to an image
const isImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
        const path = new URL(url).pathname;
        return /\.(jpeg|jpg|png)$/i.test(path);
    } catch (e) {
        return false;
    }
};

// Helper to create a clean and safe filename
const createCleanFilename = (title: string, suffix: string, url: string): string => {
    const extensionMatch = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    const extension = extensionMatch ? extensionMatch[1] : 'file';
    const sanitizedTitle = title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_').toLowerCase();
    return `${sanitizedTitle}_${suffix}.${extension}`;
};


export function CorrectionViewer({ isOpen, onOpenChange, essay }: CorrectionViewerProps) {
  if (!essay || essay.status !== 'corrected') {
    return null;
  }

  const formattedFeedback = essay.textFeedback?.replace(/\n/g, '<br />') || 'Nenhum feedback fornecido.';
  const correctedFileIsImage = isImageUrl(essay.correctedFileUrl);

  const originalFilename = essay.fileUrl ? createCleanFilename(essay.title, 'original', essay.fileUrl) : '';
  const correctedFilename = essay.correctedFileUrl ? createCleanFilename(essay.title, 'corrigido', essay.correctedFileUrl) : '';
  
  const safeCorrectedImageUrl = correctedFileIsImage && essay.correctedFileUrl 
    ? `/api/image-proxy?url=${encodeURIComponent(essay.correctedFileUrl)}` 
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px] flex flex-col h-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Correção da Redação: {essay.title}</DialogTitle>
          <DialogDescription>
            Veja abaixo os comentários do professor e os arquivos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 py-4 space-y-6 overflow-y-auto pr-4">
            <div className="space-y-2">
                <h4 className="font-semibold">Detalhes da Redação:</h4>
                <p className="text-sm text-muted-foreground"><strong>Comando da redação:</strong> {essay.promptCommands}</p>
                <p className="text-sm text-muted-foreground"><strong>Exame:</strong> {essay.targetExam}</p>
                <p className="text-sm text-muted-foreground"><strong>Tema da Redação:</strong> {essay.topic}</p>
                <p className="text-sm text-muted-foreground"><strong>Tipo de texto:</strong> {essay.textType}</p>
            </div>

             <div className="space-y-2">
                <h4 className="font-semibold">Notas:</h4>
                <div className="grid grid-cols-3 gap-4 text-center p-4 border rounded-lg">
                    <div>
                        <p className="text-sm text-muted-foreground">Conteúdo</p>
                        <p className="text-2xl font-bold">{essay.gradeContent ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Estrutura</p>
                        <p className="text-2xl font-bold">{essay.gradeStructure ?? 'N/A'}</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2 flex flex-col justify-center">
                        <p className="text-sm text-primary">Nota Final</p>
                        <p className="text-2xl font-bold text-primary">{essay.gradeFinal ?? 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="font-semibold">Feedback do Professor:</h4>
                <div 
                    className="prose prose-sm max-w-none text-muted-foreground p-3 bg-stone-100 dark:bg-stone-800 rounded-md"
                    dangerouslySetInnerHTML={{ __html: formattedFeedback }}
                />
            </div>

            {essay.audioFeedbackUrl && (
                <div className="space-y-2">
                    <h4 className="font-semibold">Feedback em Áudio:</h4>
                    <audio controls src={essay.audioFeedbackUrl} className="w-full">
                        Seu navegador não suporta o elemento de áudio.
                    </audio>
                </div>
            )}
            
            {correctedFileIsImage && safeCorrectedImageUrl && (
                <div className="space-y-2">
                    <h4 className="font-semibold">Redação Corrigida (Com Anotações):</h4>
                    <div className="relative w-full border rounded-md overflow-hidden">
                        <Image
                            src={safeCorrectedImageUrl}
                            alt="Redação corrigida com anotações"
                            width={800}
                            height={1120} // Approximate A4 aspect ratio
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            )}
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row sm:justify-start gap-2 pt-4">
            {essay.fileUrl && (
                <a href={`/api/download?url=${encodeURIComponent(essay.fileUrl)}&filename=${encodeURIComponent(originalFilename)}`} download={originalFilename} className="w-full sm:w-auto">
                    <Button type="button" variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Arquivo Original
                    </Button>
                </a>
            )}
            {essay.correctedFileUrl ? (
                 <a href={`/api/download?url=${encodeURIComponent(essay.correctedFileUrl)}&filename=${encodeURIComponent(correctedFilename)}`} download={correctedFilename} className="w-full sm:w-auto">
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
