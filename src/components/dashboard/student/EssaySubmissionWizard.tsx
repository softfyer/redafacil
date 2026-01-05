'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCard, DollarSign, Save } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import type { Essay } from '@/lib/placeholder-data';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const formSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter no mínimo 5 caracteres.' }),
  topic: z.string().min(5, { message: 'O tema deve ter no mínimo 5 caracteres.' }),
  textType: z.enum(['dissertativo-argumentativo', 'carta', 'artigo-de-opiniao', 'outro'], { required_error: 'Selecione o tipo textual.' }),
  targetExam: z.string().min(2, { message: 'O campo deve ter no mínimo 2 caracteres.' }),
  promptCommands: z.string().min(10, { message: 'Os comandos devem ter no mínimo 10 caracteres.' }),
  file: z
    .any()
    .refine((files) => files?.length == 1, "Arquivo é obrigatório.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Tamanho máximo é 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Apenas .docx, .pdf, .jpg e .png são aceitos."
    ),
});

const editFormSchema = formSchema.extend({
    file: formSchema.shape.file.optional(), // File is optional when editing
});


type EssaySubmissionWizardProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (newEssay: Omit<Essay, 'id' | 'studentId' | 'studentName' | 'submittedAt' | 'status'>) => void;
  essayToEdit: Essay | null;
};

export function EssaySubmissionWizard({ isOpen, onOpenChange, onSubmit, essayToEdit }: EssaySubmissionWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!essayToEdit;

  const currentSchema = isEditing ? editFormSchema : formSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      title: '',
      topic: '',
      targetExam: '',
      promptCommands: '',
    },
  });
  
  const fileRef = form.register("file");

  useEffect(() => {
    if (essayToEdit && isOpen) {
      form.reset({
        title: essayToEdit.title,
        topic: essayToEdit.topic,
        textType: essayToEdit.textType,
        targetExam: essayToEdit.targetExam,
        promptCommands: essayToEdit.promptCommands,
        file: undefined, // Don't pre-fill file input
      });
    } else if (!isOpen) {
        form.reset();
        setStep(1);
    }
  }, [essayToEdit, isOpen, form]);

  const handleNext = () => {
    if (isEditing) {
        handleFormSubmit();
    } else {
        setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  }

  const handleFormSubmit = () => {
    const values = form.getValues();
    // In a real app, you'd handle file upload here and get a URL
    const fileUrl = isEditing && !values.file?.[0] ? essayToEdit.fileUrl : '/placeholder-new.pdf';
    
    onSubmit({
      title: values.title,
      topic: values.topic,
      textType: values.textType,
      targetExam: values.targetExam,
      promptCommands: values.promptCommands,
      fileUrl: fileUrl 
    });
    form.reset();
    setStep(1);
  }

  const handleMockPaymentAndSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleFormSubmit();
      setIsLoading(false);
    }, 1500);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setStep(1);
    }
    onOpenChange(open);
  }

  const wizardTitle = isEditing ? "Editar Redação" : `Nova Redação (Passo ${step}/2)`;
  const wizardDescription = isEditing
    ? "Altere os dados da sua redação."
    : (step === 1 ? 'Preencha os dados e anexe seu texto.' : 'Realize o pagamento para finalizar.');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{wizardTitle}</DialogTitle>
          <DialogDescription>
            {wizardDescription}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
            <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-4">
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
                  name="topic"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Tema específico da redação</FormLabel>
                      <FormControl>
                          <Input placeholder="Ex: A persistência da violência contra a mulher..." {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="textType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo Textual</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="dissertativo-argumentativo">Dissertativo-argumentativo</SelectItem>
                                <SelectItem value="artigo-de-opiniao">Artigo de Opinião</SelectItem>
                                <SelectItem value="carta">Carta</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="targetExam"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vestibular/Concurso de Destino</FormLabel>
                        <FormControl>
                            <Input placeholder="ENEM, FUVEST, UERJ..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="promptCommands"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Comandos da Proposta</FormLabel>
                      <FormControl>
                          <Textarea placeholder="Copie aqui os comandos da proposta..." {...field} rows={4}/>
                      </FormControl>
                      <FormDescription>
                        Cole exatamente como foi apresentado a você.
                      </FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                control={form.control}
                name="file"
                render={() => (
                    <FormItem>
                    <FormLabel>Arquivo da Redação {isEditing && "(Opcional)"}</FormLabel>
                    <FormControl>
                        <Input type="file" {...fileRef} />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                        {isEditing ? "Anexe um novo arquivo para substituí-lo." : "Formatos aceitos: DOCX, PDF, JPG, PNG."}
                    </FormDescription>
                    </FormItem>
                )}
                />
                <DialogFooter className="sticky bottom-0 bg-background pt-4">
                    {isEditing ? (
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </Button>
                    ) : (
                        <Button type="submit">Próximo</Button>
                    )}
                </DialogFooter>
            </form>
            </FormProvider>
        )}

        {step === 2 && !isEditing && (
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