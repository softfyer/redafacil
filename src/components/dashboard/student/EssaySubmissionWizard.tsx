'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Send, Save, Loader2 } from 'lucide-react';
import type { Essay } from '@/lib/services/essayService';
import { addEssay } from '@/lib/services/essayService';
import { uploadEssayFile } from '@/lib/services/storageService';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

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
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Apenas .docx, .pdf, .jpg e .png são aceitos."
    ),
});

const editFormSchema = formSchema.extend({
    file: formSchema.shape.file.optional(), // File is optional when editing
});


type EssaySubmissionWizardProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitSuccess: () => void;
  essayToEdit: Essay | null;
};

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
    console.log('Submitting form for user:', user?.uid);

    if (!user) {
      toast({ title: 'Erro de Autenticação', description: 'Usuário não encontrado. Faça login novamente.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      let fileUrl = essayToEdit?.fileUrl || '';
      const fileToUpload = values.file?.[0];

      if (fileToUpload) {
        console.log('Uploading file...');
        fileUrl = await uploadEssayFile(fileToUpload, user.uid);
        console.log('File uploaded, URL:', fileUrl);
      } else if (!isEditing) {
        throw new Error("O arquivo da redação é obrigatório.");
      }
      
      const essayData = {
        title: values.title,
        topic: values.topic,
        textType: values.textType,
        targetExam: values.targetExam,
        promptCommands: values.promptCommands,
        fileUrl: fileUrl,
        status: 'a corrigir' as const, // FIX: Changed status to 'a corrigir'
      };

      if (isEditing && essayToEdit) {
        toast({ title: "Edição ainda não implementada.", description: "A atualização de redações será adicionada em breve." });
      } else {
        console.log('Adding essay to Firestore with data:', essayData);
        await addEssay(user.uid, essayData);
        toast({ title: 'Redação enviada com sucesso!', description: 'Aguarde a correção do professor.' });
      }
      
      onSubmitSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error during form submission:', error);
      toast({
        title: 'Erro no envio',
        description: error.message || 'Não foi possível enviar sua redação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const wizardTitle = isEditing ? "Editar Redação" : "Enviar Nova Redação";
  const wizardDescription = isEditing
    ? "Altere os dados da sua redação e/ou anexe um novo arquivo."
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
                    {isEditing ? "Anexe um novo arquivo para substituí-lo." : "Formatos aceitos: DOCX, PDF, JPG, PNG (máx. 5MB)."}
                </FormDescription>
                </FormItem>
            )}
            />
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Save className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />)}
                    {isLoading ? 'Enviando...' : (isEditing ? 'Salvar Alterações' : 'Enviar Redação')}
                </Button>
            </DialogFooter>
        </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}