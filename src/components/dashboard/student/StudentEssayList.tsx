'use client';

import { useState } from 'react';
import type { Essay } from '@/lib/services/essayService';
import { deleteEssay } from '@/lib/services/essayService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

type StudentEssayListProps = {
  essays: Essay[];
  onEdit: (essay: Essay) => void;
  onDeleteSuccess: () => void;
};

// Helper to format date
const formatDate = (date: any) => {
  if (!date) return 'Data desconhecida';
  // Check if it's a Firestore Timestamp and convert
  if (date.toDate) {
    return date.toDate().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
  // Fallback for Date objects or strings
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export function StudentEssayList({ essays, onEdit, onDeleteSuccess }: StudentEssayListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store deleting essay ID
  const { toast } = useToast();

  const handleDeleteClick = async (essay: Essay) => {
    if (!essay.id) return; // Guard clause
    setIsDeleting(essay.id);
    try {
      await deleteEssay(essay);
      toast({
        title: "Redação excluída!",
        description: "Sua redação foi removida com sucesso.",
      });
      onDeleteSuccess(); // Callback to refetch essays
    } catch (error) {
      console.error("Failed to delete essay:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover a redação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (essays.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium text-gray-900">Nenhuma redação enviada ainda</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em "Enviar Nova Redação" para começar.
        </p>
      </div>
    );
  }

  const getStatusVariant = (status: Essay['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'corrected':
        return 'default';
      case 'pending':
        return 'secondary';
       case 'a corrigir':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
    const getStatusText = (status: Essay['status']): string => {
    switch (status) {
      case 'corrected':
        return 'Corrigida';
      case 'pending':
        return 'Aguardando correção';
       case 'a corrigir':
        return 'Enviada';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {essays.map((essay) => (
        <Card key={essay.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-bold leading-tight pr-4">{essay.title}</CardTitle>
              <Badge variant={getStatusVariant(essay.status)}>{getStatusText(essay.status)}</Badge>
            </div>
            <CardDescription className="pt-1">
              Enviada em: {formatDate(essay.submittedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              <strong>Tema:</strong> {essay.topic}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(essay)} disabled={isDeleting === essay.id}>
                Ver Detalhes
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting === essay.id}>
                  {isDeleting === essay.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a redação
                    e o arquivo associado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteClick(essay)}>
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
