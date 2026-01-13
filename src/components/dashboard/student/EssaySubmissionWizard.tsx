'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Send, Save, Loader2, Download } from 'lucide-react';
import type { Essay } from '@/lib/services/essayService';
import { addEssay, updateEssay } from '@/lib/services/essayService';
import { uploadEssayFile } from '@/lib/services/storageService';
import { createEssayNotification } from '@/lib/services/notificationService'; // Import notification service
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const baseSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter no mínimo 5 caracteres.' }),
  topic: z.string().min(5, { message: 'O tema deve ter no mínimo 5 caracteres.' }),
  textType: z.enum(['dissertativo-argumentativo', 'carta', 'artigo-de-opiniao', 'outro'], { required_error: 'Selecione o tipo textual.' }),
  targetExam: z.string().min(2, { message: 'O campo deve ter no mínimo 2 caracteres.' }),
  promptCommands: z.string().min(10, { message: 'Os comandos devem ter no mínimo 10 caracteres.' }),
});

const formSchema = baseSchema.extend({
  file: z
    .any()
    .refine((files) => files?.length == 1, "Arquivo é obrigatório.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Tamanho máximo é 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Apenas .docx, .pdf, .jpg e .png são aceitos."
    ),
});

const editFormSchema = baseSchema.extend({
  file: z.any()
    .optional()
    .refine(
        (files) => !files || files.length === 0 || (files?.[0]?.size <= MAX_FILE_SIZE),
        `Tamanho máximo é 5MB.`
    )
    .refine(
        (files) => !files || files.length === 0 || (ACCEPTED_FILE_TYPES.includes(files?.[0]?.type)),
        "Apenas .docx, .pdf, .jpg e .png são aceitos."
    )
});


type EssaySubmissionWizardProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitSuccess: () => void;
  essayToEdit: Essay | null;
};

// Helper to get file name from URL
const getFileNameFromUrl = (url: string) => {
    try {
        const decodedUrl = decodeURIComponent(url);
        const fileNameWithToken = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1)
        const fileName = fileNameWithToken.split('?')[0];
        const finalName = fileName.substring(fileName.lastIndexOf('%') + 1) || fileName;
        return finalName;
    } catch (e) {
        return "redacao-submetida";
    }
}

export function EssaySubmissionWizard({ isOpen, onOpenChange, onSubmitSuccess, essayToEdit }: EssaySubmissionWizardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
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
        file: undefined,
      });
    } else if (!isOpen) {
        form.reset();
    }
  }, [essayToEdit, isOpen, form]);

  const handleFormSubmit = async (values: z.infer<typeof currentSchema>) => {
    setIsLoading(true);
    const user = auth.currentUser;

    if (!user) {
      toast({ title: 'Erro de Autenticação', description: 'Usuário não encontrado. Faça login novamente.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
        const fileToUpload = values.file?.[0];

        if (isEditing && essayToEdit) {
            // --- EDITING LOGIC ---
            let newFileUrl: string | undefined = undefined;
            const oldFileUrl = essayToEdit.fileUrl;

            if (fileToUpload) {
                newFileUrl = await uploadEssayFile(fileToUpload, user.uid, essayToEdit.id!);
            }
            
            const essayDataToUpdate: Essay = {
                ...essayToEdit,
                title: values.title,
                topic: values.topic,
                textType: values.textType,
                targetExam: values.targetExam,
                promptCommands: values.promptCommands,
                fileUrl: newFileUrl || oldFileUrl,
            };

            await updateEssay(essayDataToUpdate, newFileUrl, oldFileUrl);
            toast({ title: 'Redação atualizada com sucesso!', description: 'Suas alterações foram salvas.' });

        } else {
            // --- CREATING NEW ESSAY LOGIC ---
            if (!fileToUpload) {
                toast({ title: 'Arquivo Faltando', description: 'Você precisa anexar o arquivo da redação.', variant: 'destructive' });
                setIsLoading(false);
                return;
            }
            
            const essayDocData = {
                title: values.title,
                topic: values.topic,
                textType: values.textType,
                targetExam: values.targetExam,
                promptCommands: values.promptCommands,
                fileUrl: '', // Temp URL
                status: 'a corrigir' as const,
            };

            // 1. Create essay document to get an ID
            const essayId = await addEssay(user.uid, essayDocData);
            
            // 2. Upload file with the new essay ID
            const newFileUrl = await uploadEssayFile(fileToUpload, user.uid, essayId);

            // 3. Update essay document with the final file URL
            const finalEssayData: Essay = {
                id: essayId,
                studentId: user.uid,
                ...essayDocData,
                fileUrl: newFileUrl,
            };
            await updateEssay(finalEssayData);

            // 4. Create a notification for the teacher
            await createEssayNotification(finalEssayData.title, essayId);

            toast({ title: 'Redação enviada com sucesso!', description: 'Aguarde a correção do professor.' });
        }
      
      onSubmitSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error during form submission:', error);
      toast({
        title: 'Erro no envio',
        description: error.message || 'Não foi possível processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const wizardTitle = isEditing ? "Editar Redação" : "Enviar Nova Redação";
  const wizardDescription = isEditing
    ? "Altere os dados da sua redação. Para substituir o arquivo, basta anexar um novo."
    : 'Preencha os dados e anexe seu texto para correção.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{wizardTitle}</DialogTitle>
          <DialogDescription>
            {wizardDescription}
          </DialogDescription>
        </DialogHeader>
        
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-4">
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
            
            {isEditing && essayToEdit?.fileUrl && (
                 <FormItem>
                    
                    <FormControl>
                        <a href={essayToEdit.fileUrl} download={getFileNameFromUrl(essayToEdit.fileUrl)}>
                            <Button type="button" className="w-full sm:w-auto bg-background">
                                <Download className="mr-2 h-4 w-4" />
                                Baixar Redação Anexada
                            </Button>
                        </a>
                    </FormControl>
                </FormItem>
            )}
            
            <FormField
                control={form.control}
                name="file"
                render={() => (
                    <FormItem>
                    <FormLabel>{isEditing ? "Substituir Arquivo (Opcional)" : "Arquivo da Redação"}</FormLabel>
                    <FormControl>
                        <Input type="file" {...fileRef} />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                        Formatos aceitos: DOCX, PDF, JPG, PNG (máx. 5MB).
                    </FormDescription>
                    </FormItem>
                )}
            />
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Save className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />)}
                    {isLoading ? (isEditing ? 'Salvando...' : 'Enviando...') : (isEditing ? 'Salvar Alterações' : 'Enviar Redação')}
                </Button>
            </DialogFooter>
        </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}