'use client';

import { useState, useRef } from 'react';
import type { Essay } from '@/lib/services/essayService'; // Import from service
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Send, Loader2, Edit } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ClientOnly } from '@/components/ui/client-only';
import { uploadCorrectedEssayFile, uploadFeedbackAudio, uploadAnnotatedImage } from '@/lib/services/storageService';
import { submitCorrection } from '@/lib/services/essayService';
import { AnnotationModal } from './AnnotationModal'; // Importar o novo componente
import { useUser } from '@/contexts/UserContext';

type CorrectionInterfaceProps = {
  essay: Essay & { studentName: string };
  onCorrectionSubmit: () => void; // No longer needs to pass data up
  onBack: () => void;
};

// Função para verificar se a URL é de uma imagem
const isImageUrl = (url: string) => {
    // Remove query parameters from URL (like Firebase tokens) before checking extension
    try {
        const path = new URL(url).pathname;
        return /\.(jpeg|jpg|png)$/i.test(path);
    } catch (e) {
        console.error("Invalid URL for isImageUrl check:", url, e);
        return false;
    }
};

export function CorrectionInterface({ essay, onCorrectionSubmit, onBack }: CorrectionInterfaceProps) {
  const [textFeedback, setTextFeedback] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [correctedFile, setCorrectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Enviando...');
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [annotatedImageBlob, setAnnotatedImageBlob] = useState<Blob | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userData } = useUser();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCorrectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!textFeedback.trim()) {
        toast({
            title: "Campo obrigatório",
            description: "O feedback de texto não pode estar vazio.",
            variant: "destructive",
        });
        return;
    }
    if (!essay.id || !essay.studentId) {
        console.error("Essay ID or Student ID is missing.");
        toast({ title: "Erro Crítico", description: "Não foi possível identificar a redação ou o aluno.", variant: "destructive" });
        return;
    }
    if (!user || !userData) {
      toast({ title: "Erro de Autenticação", description: "Não foi possível identificar o professor.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
        let audioFeedbackUrl: string | undefined = undefined;
        let correctedFileUrl: string | undefined = undefined;

        // 1. Upload audio if it exists
        if (audioBlob) {
            setLoadingMessage('Enviando áudio...');
            audioFeedbackUrl = await uploadFeedbackAudio(audioBlob, essay.studentId, essay.id);
        }

        // 2. Upload corrected file (manual or annotated)
        if (annotatedImageBlob) {
            setLoadingMessage('Enviando imagem anotada...');
            correctedFileUrl = await uploadAnnotatedImage(annotatedImageBlob, essay.studentId, essay.id);
        } else if (correctedFile) {
            setLoadingMessage('Enviando arquivo corrigido...');
            correctedFileUrl = await uploadCorrectedEssayFile(correctedFile, essay.studentId, essay.id);
        }

        // 3. Dynamically build submission data
        setLoadingMessage('Finalizando correção...');
        const correctionData: Partial<Essay> = {
            textFeedback,
            teacherId: user.uid,
            teacherName: userData.name,
        };

        if (audioFeedbackUrl) correctionData.audioFeedbackUrl = audioFeedbackUrl;
        if (correctedFileUrl) correctionData.correctedFileUrl = correctedFileUrl;
        
        await submitCorrection(essay.id, correctionData);

        toast({
            title: 'Correção enviada!',
            description: 'A redação foi marcada como corrigida e o aluno será notificado.',
        });

        onCorrectionSubmit();

    } catch (error: any) {
        console.error("Correction submission failed: ", error);
        toast({
            title: "Falha no Envio",
            description: error.message || "Ocorreu um erro ao enviar a correção. Por favor, tente novamente.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
        setLoadingMessage('Enviando...');
    }
  };
  
  const handleAnnotationSave = (imageBlob: Blob) => {
    setAnnotatedImageBlob(imageBlob);
    setIsAnnotationModalOpen(false);
    // Limpa o input de arquivo manual para não enviar ambos
    setCorrectedFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = "";

    toast({
        title: "Anotações salvas",
        description: "A imagem com suas anotações está pronta para ser enviada com a correção."
    });
  };

  const textTypeMap: { [key: string]: string } = {
    'dissertativo-argumentativo': 'Dissertativo-Argumentativo',
    'descritivo': 'Descritivo',
    'expositivo': 'Expositivo',
    'narrativo': 'Narrativo',
    'carta': 'Carta',
  }

  return (
    <>
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Corrigindo: {essay.title}</CardTitle>
            <CardDescription>
              Enviada por {essay.studentName} em <ClientOnly>{essay.submittedAt ? format(essay.submittedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data indisponível'}</ClientOnly>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Tema</p>
                      <p className="font-semibold">{essay.topic}</p>
                  </div>
                  <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Vestibular/Concurso</p>
                      <p className="font-semibold">{essay.targetExam}</p>
                  </div>
                  <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Tipo Textual</p>
                      <p className="font-semibold">{textTypeMap[essay.textType] || 'Não especificado'}</p>
                  </div>
                  <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Comandos da Proposta</p>
                      <p className="font-mono text-sm bg-background p-3 rounded-md whitespace-pre-wrap">{essay.promptCommands}</p>
                  </div>
              </div>
              
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <a href={essay.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Redação Original
                </a>
              </Button>
              {isImageUrl(essay.fileUrl) && (
                <Button variant="outline" onClick={() => setIsAnnotationModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Anotar na Imagem
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Feedback por Áudio (Opcional)</Label>
              <AudioRecorder onRecordingComplete={setAudioBlob} disabled={isLoading}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-feedback">Feedback por Texto (Obrigatório)</Label>
              <Textarea
                id="text-feedback"
                placeholder="Digite sua análise, pontos fortes, pontos a melhorar e sugestões para o aluno..."
                value={textFeedback}
                onChange={(e) => setTextFeedback(e.target.value)}
                rows={10}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="corrected-file">
                    Anexar Redação Corrigida (Opcional)
                </Label>
                {annotatedImageBlob ? (
                    <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-300">
                        Uma imagem com anotações já foi salva e será enviada.
                    </div>
                ) : (
                    <>
                        <Input 
                            id="corrected-file" 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isLoading}
                            accept=".pdf,.doc,.docx,.png,.jpg"
                        />
                        <p className="text-xs text-muted-foreground">Anexe o arquivo com suas marcações (ex: PDF, Word, imagem).</p>
                    </>
                )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isLoading || !textFeedback.trim()}>
              {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingMessage}</>
              ) : (
                  <><Send className="mr-2 h-4 w-4" /> Enviar Correção</>
              )}
          </Button>
        </div>
      </div>
      {essay.id && isImageUrl(essay.fileUrl) && (
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
