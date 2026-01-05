'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, FilePenLine } from 'lucide-react';
import type { Essay } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ClientOnly } from '@/components/ui/client-only';

function CorrectionView({ essay }: { essay: Essay }) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl">Correção: {essay.title}</DialogTitle>
        <DialogDescription>
          Feedback detalhado do professor.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="space-y-2">
            <h3 className="font-semibold">Feedback por Texto</h3>
            <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">{essay.textFeedback}</p>
        </div>
        
        {essay.audioFeedbackUrl && (
            <div className="space-y-2">
                <h3 className="font-semibold">Feedback por Áudio</h3>
                <audio controls className="w-full">
                    <source src={essay.audioFeedbackUrl} type="audio/mpeg" />
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            </div>
        )}
        
        <Separator />

        <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" asChild className="flex-1">
                <a href={essay.fileUrl} download>Baixar Redação Original</a>
            </Button>
            <Button asChild className="flex-1">
                <a href={essay.correctedFileUrl} download>Baixar Redação Corrigida</a>
            </Button>
        </div>
      </div>
    </DialogContent>
  );
}


export function StudentEssayList({ essays, onEdit }: { essays: Essay[], onEdit: (essay: Essay) => void }) {
  if (essays.length === 0) {
    return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma redação enviada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Quando você enviar sua primeira redação, ela aparecerá aqui.
            </p>
        </div>
    )
  }
  
  return (
    <div className="space-y-6">
        <div className="grid gap-6">
            {essays.map((essay) => (
            <Dialog key={essay.id}>
                <Card>
                    <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">{essay.title}</CardTitle>
                            <CardDescription>
                                Enviada em <ClientOnly>{format(essay.submittedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</ClientOnly>
                            </CardDescription>
                        </div>
                        <div>
                        {essay.status === 'corrected' ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Corrigida
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                Enviada
                            </Badge>
                        )}
                        </div>
                    </CardHeader>
                    <CardFooter>
                        {essay.status === 'corrected' ? (
                            <DialogTrigger asChild>
                                <Button>Ver Correção</Button>
                            </DialogTrigger>
                        ) : (
                            <Button variant="outline" onClick={() => onEdit(essay)}>
                                <FilePenLine className="mr-2 h-4 w-4" />
                                Editar Envio
                            </Button>
                        )}
                    </CardFooter>
                </Card>
                {essay.status === 'corrected' && <CorrectionView essay={essay} />}
            </Dialog>
            ))}
        </div>
    </div>
  );
}
