'use client';

import { useState, useRef, useEffect } from 'react';
import type { Essay } from '@/lib/services/essayService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  uploadCorrectedEssayFile,
  uploadFeedbackAudio,
  deleteFileByUrl,
} from '@/lib/services/storageService';
import { submitCorrection } from '@/lib/services/essayService';
import { AudioRecorder } from './AudioRecorder';

type EditCorrectionModalProps = {
  essay: Essay | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrectionUpdated: () => void;
};

export function EditCorrectionModal({
  essay,
  isOpen,
  onClose,
  onCorrectionUpdated,
}: EditCorrectionModalProps) {
  const [textFeedback, setTextFeedback] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [newCorrectedFile, setNewCorrectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Atualizando...');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (essay) {
      setTextFeedback(essay.textFeedback || '');
    }
  }, [essay]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewCorrectedFile(file);
    }
  };

  const handleUpdate = async () => {
    if (!essay?.id) {
      toast({
        title: 'Erro',
        description: 'ID da redação não encontrado.',
        variant: 'destructive',
      });
      return;
    }
    if (!textFeedback.trim()) {
      toast({
        title: 'Campo Obrigatório',
        description: 'O feedback de texto não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let audioFeedbackUrl = essay.audioFeedbackUrl;
      let correctedFileUrl = essay.correctedFileUrl;

      if (audioBlob) {
        setLoadingMessage('Enviando novo áudio...');
        if (essay.audioFeedbackUrl) {
          await deleteFileByUrl(essay.audioFeedbackUrl);
        }
        audioFeedbackUrl = await uploadFeedbackAudio(
          audioBlob,
          essay.studentId,
          essay.id
        );
      }

      if (newCorrectedFile) {
        setLoadingMessage('Enviando novo arquivo...');
        if (essay.correctedFileUrl) {
          await deleteFileByUrl(essay.correctedFileUrl);
        }
        correctedFileUrl = await uploadCorrectedEssayFile(
          newCorrectedFile,
          essay.studentId,
          essay.id
        );
      }

      setLoadingMessage('Finalizando atualização...');
      const updatedData = {
        textFeedback,
        audioFeedbackUrl: audioFeedbackUrl || '',
        correctedFileUrl: correctedFileUrl || '',
      };

      await submitCorrection(essay.id, updatedData);

      toast({
        title: 'Correção Atualizada!',
        description: 'As informações da correção foram salvas com sucesso.',
      });

      onCorrectionUpdated();
      handleClose();
    } catch (error: any) {
      console.error('Failed to update correction: ', error);
      toast({
        title: 'Falha na Atualização',
        description:
          error.message ||
          'Ocorreu um erro ao atualizar. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTextFeedback('');
    setAudioBlob(null);
    setNewCorrectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };
  
  const handleRemoveFile = async (fileType: 'audio' | 'correctedFile') => {
      if (!essay || !essay.id) return;
  
      setIsLoading(true);
      setLoadingMessage(`Removendo ${fileType === 'audio' ? 'áudio' : 'arquivo'}...`);
  
      try {
          let fileUrl: string | undefined;
          let updateData: Partial<Essay> = {};
  
          if (fileType === 'audio' && essay.audioFeedbackUrl) {
              fileUrl = essay.audioFeedbackUrl;
              updateData.audioFeedbackUrl = '';
          } else if (fileType === 'correctedFile' && essay.correctedFileUrl) {
              fileUrl = essay.correctedFileUrl;
              updateData.correctedFileUrl = '';
          }
  
          if (fileUrl) {
              await deleteFileByUrl(fileUrl);
              await submitCorrection(essay.id, { 
                  textFeedback: essay.textFeedback,
                  audioFeedbackUrl: fileType === 'audio' ? '' : essay.audioFeedbackUrl,
                  correctedFileUrl: fileType === 'correctedFile' ? '' : essay.correctedFileUrl,
              });
              toast({ title: 'Arquivo Removido', description: 'O arquivo foi removido com sucesso.' });
              onCorrectionUpdated(); // This will re-fetch and re-render
          }
      } catch (error: any) {
          console.error(`Failed to remove ${fileType}: `, error);
          toast({ title: 'Erro ao Remover', description: 'Não foi possível remover o arquivo.', variant: 'destructive' });
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Correção: {essay?.title}</DialogTitle>
        </DialogHeader>
        {/* The main scrollable content area */}
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-4">

          {/* Text Feedback */}
          <div className="space-y-2">
            <Label htmlFor="edit-text-feedback">Feedback por Texto</Label>
            <Textarea
              id="edit-text-feedback"
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              rows={8}
              disabled={isLoading}
            />
          </div>

          {/* Audio Feedback */}
          <div className="space-y-2">
            <Label>Feedback por Áudio</Label>
            {essay?.audioFeedbackUrl && !audioBlob && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <audio controls src={essay.audioFeedbackUrl} className="flex-grow"/>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveFile('audio')} disabled={isLoading}>
                    <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <AudioRecorder
              onRecordingComplete={setAudioBlob}
            />
             <p className="text-xs text-muted-foreground">
                Grave um novo áudio para substituir o existente ou remova o atual.
            </p>
          </div>

          {/* Corrected File */}
          <div className="space-y-2">
            <Label htmlFor="edit-corrected-file">
              Anexar Nova Redação Corrigida
            </Label>
            {essay?.correctedFileUrl && !newCorrectedFile && (
               <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                 <a href={essay.correctedFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
                    Ver arquivo corrigido atual
                 </a>
                 <Button variant="ghost" size="icon" onClick={() => handleRemoveFile('correctedFile')} disabled={isLoading}>
                    <X className="h-4 w-4" />
                 </Button>
               </div>
            )}
            <Input
              id="edit-corrected-file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isLoading}
              accept=".pdf,.doc,.docx,.png,.jpg"
            />
             <p className="text-xs text-muted-foreground">
                Envie um novo arquivo para substituir o existente ou remova o atual.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
