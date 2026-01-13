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
import { Loader2, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  uploadCorrectedEssayFile,
  uploadFeedbackAudio,
  deleteFileByUrl,
  uploadAnnotatedImage,
} from '@/lib/services/storageService';
import { submitCorrection } from '@/lib/services/essayService';
import { AudioRecorder } from './AudioRecorder';
import { AnnotationModal } from './AnnotationModal';
import { useUser } from '@/contexts/UserContext';

type EditCorrectionModalProps = {
  essay: Essay | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrectionUpdated: () => void;
};

const isImageUrl = (url: string | undefined) => {
    if (!url) return false;
    try {
        const path = new URL(url).pathname;
        return /\.(jpeg|jpg|png)$/i.test(path);
    } catch (e) {
        console.error("Invalid URL for isImageUrl check:", url, e);
        return false;
    }
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
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [annotatedImageBlob, setAnnotatedImageBlob] = useState<Blob | null>(null);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userData } = useUser();

  useEffect(() => {
    if (essay && isOpen) {
      setTextFeedback(essay.textFeedback || '');
    } else if (!isOpen) {
      // Reset state when modal is closed
      setTextFeedback('');
      setAudioBlob(null);
      setNewCorrectedFile(null);
      setAnnotatedImageBlob(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [essay, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewCorrectedFile(file);
      setAnnotatedImageBlob(null); // Clear annotated image if a file is manually uploaded
    }
  };

  const handleAnnotationSave = (imageBlob: Blob) => {
    setAnnotatedImageBlob(imageBlob);
    setIsAnnotationModalOpen(false);
    setNewCorrectedFile(null); // Clear manual file if an annotation is saved
    if (fileInputRef.current) fileInputRef.current.value = "";

    toast({
        title: "Anotações salvas",
        description: "A nova imagem com suas anotações está pronta para ser enviada."
    });
  };

  const handleUpdate = async () => {
    if (!essay?.id || !essay.studentId) {
      toast({
        title: 'Erro',
        description: 'ID da redação ou do aluno não encontrado.',
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
    if (!user || !userData) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Não foi possível identificar o professor.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let audioFeedbackUrl = essay.audioFeedbackUrl;
      let correctedFileUrl = essay.correctedFileUrl;

      // Handle Audio Upload
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

      // Handle File/Annotation Upload (prioritize annotation)
      if (annotatedImageBlob) {
        setLoadingMessage('Enviando imagem anotada...');
        if (essay.correctedFileUrl) {
           await deleteFileByUrl(essay.correctedFileUrl);
        }
        correctedFileUrl = await uploadAnnotatedImage(annotatedImageBlob, essay.studentId, essay.id);
      } else if (newCorrectedFile) {
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
      
      // Build a clean update object
      const updatedData: Partial<Essay> = {
        textFeedback,
        audioFeedbackUrl: audioFeedbackUrl || '', // Ensure no undefined
        correctedFileUrl: correctedFileUrl || '', // Ensure no undefined
        teacherId: user.uid,
        teacherName: userData.name,
        correctedAt: essay.correctedAt, 
        status: 'corrected',
      };

      await submitCorrection(essay.id, updatedData);

      toast({
        title: 'Correção Atualizada!',
        description: 'As informações da correção foram salvas com sucesso.',
      });

      onCorrectionUpdated();
      onClose();
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
  
  const handleRemoveFile = async (fileType: 'audio' | 'correctedFile') => {
      if (!essay || !essay.id) return;
  
      setIsLoading(true);
      setLoadingMessage(`Removendo ${fileType === 'audio' ? 'áudio' : 'arquivo'}...`);
  
      try {
          const updateData: Partial<Essay> = {};
          let fileUrlToRemove: string | undefined;

          if (fileType === 'audio' && essay.audioFeedbackUrl) {
              fileUrlToRemove = essay.audioFeedbackUrl;
              updateData.audioFeedbackUrl = ''; // Set field to empty
          } else if (fileType === 'correctedFile' && essay.correctedFileUrl) {
              fileUrlToRemove = essay.correctedFileUrl;
              updateData.correctedFileUrl = ''; // Set field to empty
          }
  
          if (fileUrlToRemove) {
              // First, delete the file from storage
              await deleteFileByUrl(fileUrlToRemove);
              
              // Then, update the document in Firestore to remove the URL
              await submitCorrection(essay.id, updateData);

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
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Correção: {essay?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-4">

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
              disabled={isLoading}
            />
             <p className="text-xs text-muted-foreground">
                Grave um novo áudio para substituir o existente ou remova o atual.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-corrected-file">
              Redação Corrigida
            </Label>
            {essay?.correctedFileUrl && !newCorrectedFile && !annotatedImageBlob && (
               <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                 <a href={essay.correctedFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
                    Ver arquivo corrigido atual
                 </a>
                 <Button variant="ghost" size="icon" onClick={() => handleRemoveFile('correctedFile')} disabled={isLoading}>
                    <X className="h-4 w-4" />
                 </Button>
               </div>
            )}
            {isImageUrl(essay?.fileUrl) && (
                <Button variant="outline" onClick={() => setIsAnnotationModalOpen(true)} className="w-full mb-2">
                  <Edit className="mr-2 h-4 w-4" />
                  Anotar na Imagem Original
                </Button>
            )}
             {annotatedImageBlob && (
                <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-300">
                    Uma nova imagem com anotações está pronta para ser enviada e substituirá o arquivo corrigido atual.
                </div>
            )}
            <Input
              id="edit-corrected-file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isLoading || !!annotatedImageBlob}
              accept=".pdf,.doc,.docx,.png,.jpg"
            />
             <p className="text-xs text-muted-foreground">
                Envie um novo arquivo para substituir o existente. Se anotar na imagem, este campo será desabilitado.
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

    {essay?.id && isImageUrl(essay.fileUrl) && (
        <AnnotationModal
            isOpen={isAnnotationModalOpen}
            onClose={() => setIsAnnotationModalOpen(false)}
            imageUrl={essay.fileUrl}
            essayId={essay.id}
            onSave={handleAnnotationSave}
        />
    )}
    </>
  );
}
