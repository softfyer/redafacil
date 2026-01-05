'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';
import type { Essay } from '@/lib/placeholder-data';
import { useState } from 'react';

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

type EssayUploadFormProps = {
    onUpload: (newEssay: Omit<Essay, 'id' | 'studentId' | 'studentName' | 'submittedAt' | 'status'>) => void;
}

export function EssayUploadForm({ onUpload }: EssayUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Mock upload
    setTimeout(() => {
        onUpload({
            title: values.title,
            fileUrl: '/placeholder-new.pdf' // Use a placeholder URL
        });
        setIsLoading(false);
        form.reset();
    }, 1500)
  }

  const fileRef = form.register("file");

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Redação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: O estigma associado às doenças mentais na sociedade brasileira" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="file"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Arquivo da Redação</FormLabel>
                    <FormControl>
                        <Input type="file" {...fileRef} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar para correção'}
                {!isLoading && <UploadCloud className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
