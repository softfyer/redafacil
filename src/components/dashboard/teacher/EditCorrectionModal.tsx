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
import { FileViewerModal } from './FileViewerModal';

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

const getMimeTypeFromUrl = (url: string | undefined): 'image/jpeg' | 'image/png' => {
    if (!url) return 'image/jpeg';
    try {
        const path = new URL(url).pathname.toLowerCase();
        if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            return 'image/jpeg';
        }
        return 'image/jpeg';
    } catch (e) {
        return 'image/jpeg';
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
  const [gradeContent, setGradeContent] = useState<number | undefined>();
  const [gradeStructure, setGradeStructure] = useState<number | undefined>();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // State to manage file URLs displayed in the UI
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined | null>(null);
  const [currentCorrectedFileUrl, setCurrentCorrectedFileUrl] = useState<string | undefined | null>(null);


  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userData } = useUser();
  const originalMimeType = getMimeTypeFromUrl(essay?.fileUrl);
  
  const gradeFinal = (gradeContent ?? 0) + (gradeStructure ?? 0);

  useEffect(() => {
    if (essay && isOpen) {
      setTextFeedback(essay.textFeedback || '');
      setGradeContent(essay.gradeContent);
      setGradeStructure(essay.gradeStructure);
      setCurrentAudioUrl(essay.audioFeedbackUrl);
      setCurrentCorrectedFileUrl(essay.correctedFileUrl);
    } else if (!isOpen) {
      // Reset state when modal is closed
      setTextFeedback('');
      setAudioBlob(null);
      setNewCorrectedFile(null);
      setAnnotatedImageBlob(null);
      setGradeContent(undefined);
      setGradeStructure(undefined);
      setCurrentAudioUrl(null);
      setCurrentCorrectedFileUrl(null);
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
      toast({ title: 'Erro', description: 'ID da redação ou do aluno não encontrado.', variant: 'destructive'});
      return;
    }
    if (!textFeedback.trim()) {
      toast({ title: 'Campo Obrigatório', description: 'O feedback de texto não pode estar vazio.', variant: 'destructive' });
      return;
    }
     if (gradeContent === undefined || gradeStructure === undefined) {
      toast({ title: 'Campos obrigatórios', description: 'As notas de conteúdo e estrutura devem ser preenchidas.', variant: 'destructive'});
      return;
    }
    if (!user || !userData) {
      toast({ title: 'Erro de Autenticação', description: 'Não foi possível identificar o professor.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
        const updatedData: Partial<Essay> = {
            textFeedback,
            teacherId: user.uid,
            teacherName: userData.name,
            correctedAt: essay.correctedAt,
            status: 'corrected',
            gradeContent,
            gradeStructure,
            gradeFinal,
        };

      // --- Handle Audio ---
      if (audioBlob) { // Case 1: New audio recorded (takes precedence)
        setLoadingMessage('Enviando novo áudio...');
        if (essay.audioFeedbackUrl) {
          await deleteFileByUrl(essay.audioFeedbackUrl);
        }
        updatedData.audioFeedbackUrl = await uploadFeedbackAudio(audioBlob, essay.studentId, essay.id);
      } else if (essay.audioFeedbackUrl && !currentAudioUrl) { // Case 2: Existing audio removed
        setLoadingMessage('Removendo áudio...');
        await deleteFileByUrl(essay.audioFeedbackUrl);
        updatedData.audioFeedbackUrl = null as any; // Set to null instead of ''
      }

      // --- Handle Corrected File ---
      if (annotatedImageBlob) { // Case 1: New annotated image (takes precedence)
        setLoadingMessage('Enviando imagem anotada...');
        if (essay.correctedFileUrl) {
          await deleteFileByUrl(essay.correctedFileUrl);
        }
        updatedData.correctedFileUrl = await uploadAnnotatedImage(annotatedImageBlob, essay.studentId, essay.id);
      } else if (newCorrectedFile) { // Case 2: New file uploaded
        setLoadingMessage('Enviando novo arquivo...');
        if (essay.correctedFileUrl) {
          await deleteFileByUrl(essay.correctedFileUrl);
        }
        updatedData.correctedFileUrl = await uploadCorrectedEssayFile(newCorrectedFile, essay.studentId, essay.id);
      } else if (essay.correctedFileUrl && !currentCorrectedFileUrl) { // Case 3: Existing file removed
        setLoadingMessage('Removendo arquivo corrigido...');
        await deleteFileByUrl(essay.correctedFileUrl);
        updatedData.correctedFileUrl = null as any; // Set to null instead of ''
      }

      setLoadingMessage('Finalizando atualização...');

      await submitCorrection(essay.id, updatedData);

      toast({ title: 'Correção Atualizada!', description: 'As informações da correção foram salvas com sucesso.' });
      onCorrectionUpdated();
      onClose();

    } catch (error: any) {
      console.error('Failed to update correction: ', error);
      toast({ title: 'Falha na Atualização', description: error.message || 'Ocorreu um erro ao atualizar. Por favor, tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveFile = (fileType: 'audio' | 'correctedFile') => {
    if (fileType === 'audio') {
        setCurrentAudioUrl(null);
        toast({
            title: 'Áudio marcado para remoção',
            description: 'A remoção será concluída ao salvar as alterações.',
            duration: 4000,
        });
    } else if (fileType === 'correctedFile') {
        setCurrentCorrectedFileUrl(null);
        toast({
            title: 'Arquivo corrigido marcado para remoção',
            description: 'A remoção será concluída ao salvar as alterações.',
            duration: 4000,
        });
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
                <Label htmlFor="edit-corrected-file" className="font-bold text-base">
                    1. Redação Corrigida (Anexar ou Anotar)
                </Label>
                {currentCorrectedFileUrl && !newCorrectedFile && !annotatedImageBlob && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                    <Button
                        type="button"
                        variant="link"
                        className="text-sm font-medium p-0 h-auto"
                        onClick={() => setIsViewerOpen(true)}
                    >
                        Ver arquivo corrigido atual
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFile('correctedFile')} disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                )}
                {isImageUrl(essay?.fileUrl) && (
                    <Button variant="outline" onClick={() => setIsAnnotationModalOpen(true)} className="w-full" disabled={isLoading}>
                    <Edit className="mr-2 h-4 w-4" />
                    Anotar novamente na Imagem Original
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

            <div className="space-y-2">
                <Label htmlFor="edit-text-feedback" className="font-bold text-base">2. Feedback por Texto</Label>
                <Textarea
                id="edit-text-feedback"
                value={textFeedback}
                onChange={(e) => setTextFeedback(e.target.value)}
                rows={8}
                disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label className="font-bold text-base">3. Feedback por Áudio</Label>
                {currentAudioUrl && !audioBlob && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <audio controls src={currentAudioUrl} className="flex-grow"/>
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
                <Label className="font-bold text-base">4. Notas</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="gradeContent-edit">Nota de Conteúdo</Label>
                        <Input
                            id="gradeContent-edit"
                            type="number"
                            placeholder="0-50"
                            value={gradeContent ?? ''}
                            onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setGradeContent(undefined);
                                        return;
                                    }
                                    let num = parseInt(val, 10);
                                    if (!isNaN(num)) {
                                        if (num > 50) num = 50;
                                        if (num < 0) num = 0;
                                        setGradeContent(num);
                                    }
                                }}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gradeStructure-edit">Nota de Estrutura</Label>
                        <Input
                            id="gradeStructure-edit"
                            type="number"
                            placeholder="0-50"
                            value={gradeStructure ?? ''}
                            onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setGradeStructure(undefined);
                                        return;
                                    }
                                    let num = parseInt(val, 10);
                                    if (!isNaN(num)) {
                                        if (num > 50) num = 50;
                                        if (num < 0) num = 0;
                                        setGradeStructure(num);
                                    }
                                }}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Nota Final</Label>
                        <Input type="number" value={gradeFinal} readOnly disabled className="font-bold text-lg text-center" />
                    </div>
                </div>
            </div>

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleUpdate} disabled={isLoading || !textFeedback.trim() || gradeContent === undefined || gradeStructure === undefined}>
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
    
    <FileViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        fileUrl={currentCorrectedFileUrl}
        title={essay?.title || 'Arquivo Corrigido'}
    />

    {essay?.id && isImageUrl(essay.fileUrl) && (
        <AnnotationModal
            isOpen={isAnnotationModalOpen}
            onClose={() => setIsAnnotationModalOpen(false)}
            imageUrl={essay.fileUrl}
            essayId={essay.id}
            onSave={handleAnnotationSave}
            originalMimeType={originalMimeType}
        />
    )}
    </>
  );
}
