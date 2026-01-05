'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Essay } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Search } from 'lucide-react';

export function CorrectedEssayList({ essays }: { essays: Essay[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredEssays = useMemo(() => {
    return essays.filter(
      (essay) =>
        essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        essay.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [essays, searchTerm]);

  const totalPages = Math.ceil(filteredEssays.length / itemsPerPage);
  const paginatedEssays = filteredEssays.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redações Corrigidas</CardTitle>
        <CardDescription>
          Visualize o histórico de redações que você já corrigiu.
        </CardDescription>
        <div className="relative pt-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título ou aluno..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="hidden sm:table-cell">Título</TableHead>
              <TableHead className="hidden md:table-cell">Data de Envio</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEssays.map((essay) => (
              <TableRow key={essay.id}>
                <TableCell className="font-medium">{essay.studentName}</TableCell>
                <TableCell className="hidden sm:table-cell max-w-xs truncate">{essay.title}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(essay.submittedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Corrigida
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {paginatedEssays.length} de {filteredEssays.length} redações
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Itens por página</p>
                <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
