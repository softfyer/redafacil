'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCard, DollarSign } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import type { Essay } from '@/lib/placeholder-data';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const formSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter no mínimo 5 caracteres.' }),
  file: z
    .any()
    .refine((files) => files?.length == 1, "Arquivo é obrigatório.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Tamanho máximo é 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Apenas .docx, .pdf, .jpg e .png são aceitos."
    ),
});

type EssaySubmissionWizardProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (newEssay: Omit<Essay, 'id' | 'studentId' | 'studentName' | 'submittedAt' | 'status'>) => void;
};

export function EssaySubmissionWizard({ isOpen, onOpenChange, onSubmit }: EssaySubmissionWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  });
  
  const fileRef = form.register("file");

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  }

  const handleMockPaymentAndSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      const values = form.getValues();
      onSubmit({
        title: values.title,
        fileUrl: '/placeholder-new.pdf' // Use a placeholder URL
      });
      setIsLoading(false);
      form.reset();
      setStep(1);
    }, 1500);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setStep(1);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Redação (Passo {step}/2)</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Preencha os dados e anexe seu texto.' : 'Realize o pagamento para finalizar.'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
            <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-4 pt-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Título da Redação</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: O estigma associado às doenças mentais..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="file"
                render={() => (
                    <FormItem>
                    <FormLabel>Arquivo da Redação</FormLabel>
                    <FormControl>
                        <Input type="file" {...fileRef} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                    <Button type="submit">Próximo</Button>
                </DialogFooter>
            </form>
            </FormProvider>
        )}

        {step === 2 && (
          <div className="pt-4 space-y-6">
            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                <div className='flex items-center gap-2'>
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-medium">1 Crédito de Correção</span>
                </div>
                <span className="font-bold text-lg">R$ 15,00</span>
            </div>
            <p className="text-xs text-muted-foreground">
                Este é um ambiente de demonstração. Clique abaixo para simular o pagamento.
            </p>
            <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Button onClick={handleMockPaymentAndSubmit} className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? 'Processando...' : 'Simular Pagamento'}
                    {!isLoading && <CreditCard className="ml-2 h-4 w-4" />}
                </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
