'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Essay } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilePenLine, Inbox } from 'lucide-react';

type TeacherEssayListProps = {
  essays: Essay[];
  onSelectEssay: (essay: Essay) => void;
};

export function TeacherEssayList({ essays, onSelectEssay }: TeacherEssayListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redações para Corrigir</CardTitle>
        <CardDescription>
          Você tem {essays.length} redação(ões) pendente(s) de correção.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {essays.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="hidden sm:table-cell">Título</TableHead>
                <TableHead className="hidden md:table-cell">Data de Envio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {essays.map((essay) => (
                <TableRow key={essay.id}>
                  <TableCell className="font-medium">{essay.studentName}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-xs truncate">{essay.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(essay.submittedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => onSelectEssay(essay)} size="sm">
                      <FilePenLine className="mr-2 h-4 w-4" />
                      Corrigir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
            <div className="text-center py-12">
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Caixa de entrada vazia!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Não há nenhuma redação para corrigir no momento.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
