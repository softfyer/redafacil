'use client';

import type { Essay } from '@/lib/services/essayService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Clock } from 'lucide-react';


type StudentEssayListProps = {
  essays: Essay[];
  onEdit: (essay: Essay) => void;
};

const formatDate = (date: any) => {
  if (!date?.toDate) return 'Data desconhecida';
  return date.toDate().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Helper to calculate and format the correction deadline
const getCorrectionDeadline = (date: any): string => {
  if (!date?.toDate) return '';
  const submissionDate = date.toDate();
  const deadline = new Date(submissionDate);
  deadline.setDate(deadline.getDate() + 2); // Add 2 days
  return deadline.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long'
  });
};

export function StudentEssayList({ essays, onEdit }: StudentEssayListProps) {
  if (essays.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg mt-6">
        <h3 className="text-xl font-medium">Nenhuma redação enviada</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Quando você enviar sua primeira redação, ela aparecerá aqui.
        </p>
      </div>
    );
  }

  const getStatusVariant = (status: Essay['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'corrected':
        return 'default';
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
      case 'a corrigir':
        return 'Enviada';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {essays.map((essay) => (
        <Card key={essay.id} className="flex flex-col hover:border-primary/50 transition-all">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-bold leading-tight pr-2">{essay.title}</CardTitle>
              <Badge variant={getStatusVariant(essay.status)} className="flex-shrink-0">{getStatusText(essay.status)}</Badge>
            </div>
            <CardDescription className="pt-1">
              Enviada em: {formatDate(essay.submittedAt)}
            </CardDescription>
            {/* Prazo de correção - Mostrado apenas se o status for 'a corrigir' */}
            {essay.status === 'a corrigir' && (
              <div className="flex items-center text-sm text-amber-600 dark:text-amber-500 pt-2 font-medium">
                <Clock className="mr-2 h-4 w-4" />
                <span>Aguarde a correção até {getCorrectionDeadline(essay.submittedAt)}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              <strong>Tema:</strong> {essay.topic}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(essay)}>
              {essay.status === 'corrected' ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Correção
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar/Ver
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
