'use client';

import { useState } from 'react';
import type { Essay } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Send, Upload } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type CorrectionInterfaceProps = {
  essay: Essay;
  onCorrectionSubmit: (correctedData: Partial<Essay>) => void;
  onBack: () => void;
};

export function CorrectionInterface({ essay, onCorrectionSubmit, onBack }: CorrectionInterfaceProps) {
  const [textFeedback, setTextFeedback] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!textFeedback) {
        toast({
            title: "Campo obrigatório",
            description: "O feedback de texto não pode estar vazio.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    // Mock submission
    setTimeout(() => {
        onCorrectionSubmit({
            textFeedback,
            audioFeedbackUrl: audioUrl || undefined,
            correctedFileUrl: '/placeholder-corrected.pdf', // Mock corrected file
        });
        setIsLoading(false);
    }, 1500)
  };

  const textTypeMap = {
    'dissertativo-argumentativo': 'Dissertativo-Argumentativo',
    'carta': 'Carta',
    'artigo-de-opiniao': 'Artigo de Opinião',
    'outro': 'Outro'
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a lista
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Corrigindo: {essay.title}</CardTitle>
          <CardDescription>
            Enviada por {essay.studentName} em {format(essay.submittedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
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
                    <p className="font-semibold">{textTypeMap[essay.textType]}</p>
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Comandos da Proposta</p>
                    <p className="font-mono text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{essay.promptCommands}</p>
                </div>
            </div>
            
          <div>
            <Button asChild variant="secondary">
              <a href={essay.fileUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Baixar Redação Original
              </a>
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Feedback por Áudio</Label>
            <AudioRecorder onRecordingComplete={setAudioUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-feedback">Feedback por Texto</Label>
            <Textarea
              id="text-feedback"
              placeholder="Digite seu feedback aqui..."
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corrected-file">Anexar Redação Corrigida</Label>
            <Input id="corrected-file" type="file" />
            <p className="text-xs text-muted-foreground">Opcional. Você pode anexar o arquivo com suas marcações.</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Correção'}
            <Send className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}