'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Inbox, Loader2, Edit, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditCorrectionModal } from './EditCorrectionModal';
import { CorrectionViewer } from '@/components/dashboard/student/CorrectionViewer';
import type { Essay } from '@/lib/services/essayService';
import { useUser } from '@/contexts/UserContext';

// Enrich the Essay type for local state management
export type EnrichedEssay = Essay & {
  studentName: string;
  submittedAt: Date;
  correctedAt?: Date;
  teacherName?: string;
};

const getUniqueYears = (essays: EnrichedEssay[]): string[] => {
    const yearSet = new Set<string>();
    essays.forEach(essay => {
        if (essay.correctedAt) {
            yearSet.add(format(essay.correctedAt, 'yyyy'));
        }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a)); // Sort descending
};

const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];

const ESSAYS_PER_PAGE = 50;

export function CorrectedEssayList() {
  const [essays, setEssays] = useState<EnrichedEssay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [teacherNameFilter, setTeacherNameFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEssay, setSelectedEssay] = useState<EnrichedEssay | null>(null);
  const { user } = useUser();

  const fetchCorrectedEssays = useCallback(async () => {
    setIsLoading(true);
    try {
      const essaysQuery = query(
        collection(db, 'essays'),
        where('status', '==', 'corrected'),
        orderBy('correctedAt', 'desc')
      );

      const essaySnapshots = await getDocs(essaysQuery);
      const essaysFromDB = essaySnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (Essay & { submittedAt: any, correctedAt: any })[];

      if (essaysFromDB.length > 0) {
        const studentIds = [...new Set(essaysFromDB.map(e => e.studentId))].filter(id => id);
        const studentNames = new Map<string, string>();

        if (studentIds.length > 0) {
          const studentsQuery = query(collection(db, 'students'), where(documentId(), 'in', studentIds));
          const studentSnapshots = await getDocs(studentsQuery);
          studentSnapshots.forEach(doc => {
            studentNames.set(doc.id, doc.data().name || 'Aluno Desconhecido');
          });
        }

        const enrichedEssays = essaysFromDB.map(essay => ({
          ...essay,
          studentName: studentNames.get(essay.studentId) || 'Aluno Desconhecido',
          submittedAt: essay.submittedAt.toDate(),
          correctedAt: essay.correctedAt?.toDate(),
          teacherName: essay.teacherName || 'Não identificado'
        }));

        setEssays(enrichedEssays);
      } else {
        setEssays([]);
      }
    } catch (error) {
      console.error("Error fetching corrected essays: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorrectedEssays();
  }, [fetchCorrectedEssays]);

  const uniqueYears = useMemo(() => getUniqueYears(essays), [essays]);

  const filteredEssays = useMemo(() => {
    return essays.filter(essay => {
      const studentMatch = studentNameFilter ? essay.studentName.toLowerCase().includes(studentNameFilter.toLowerCase()) : true;
      const teacherMatch = teacherNameFilter ? (essay.teacherName ?? '').toLowerCase().includes(teacherNameFilter.toLowerCase()) : true;
      const yearMatch = !yearFilter || (essay.correctedAt && format(essay.correctedAt, 'yyyy') === yearFilter);
      const monthMatch = !monthFilter || (essay.correctedAt && format(essay.correctedAt, 'MM') === monthFilter);
      
      return studentMatch && teacherMatch && yearMatch && monthMatch;
    });
  }, [essays, studentNameFilter, teacherNameFilter, yearFilter, monthFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [studentNameFilter, teacherNameFilter, yearFilter, monthFilter]);

  const totalPages = Math.ceil(filteredEssays.length / ESSAYS_PER_PAGE);
  const paginatedEssays = useMemo(() => {
    const startIndex = (currentPage - 1) * ESSAYS_PER_PAGE;
    return filteredEssays.slice(startIndex, startIndex + ESSAYS_PER_PAGE);
  }, [filteredEssays, currentPage]);


  const handleEditClick = (essay: EnrichedEssay) => {
    setSelectedEssay(essay);
    setIsEditModalOpen(true);
  };
  
  const handleViewClick = (essay: EnrichedEssay) => {
    setSelectedEssay(essay);
    setIsViewModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedEssay(null);
  };

  const handleViewModalOpenChange = (open: boolean) => {
    setIsViewModalOpen(open);
    if (!open) {
      setSelectedEssay(null);
    }
  }

  const handleCorrectionUpdated = () => {
    handleEditModalClose();
    fetchCorrectedEssays(); // Re-fetch the list to show updated data
  };

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Redações Corrigidas</CardTitle>
            <CardDescription>
            {isLoading ? 'Buscando histórico...' : `${filteredEssays.length} redação(ões) encontrada(s).`}
            </CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <Input
                  placeholder="Filtrar por aluno..."
                  value={studentNameFilter}
                  onChange={(e) => setStudentNameFilter(e.target.value)}
                  disabled={isLoading}
              />
              <Input
                  placeholder="Filtrar por professor..."
                  value={teacherNameFilter}
                  onChange={(e) => setTeacherNameFilter(e.target.value)}
                  disabled={isLoading}
              />
              <Select onValueChange={setYearFilter} value={yearFilter} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os anos</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select onValueChange={setMonthFilter} value={monthFilter} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os meses</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : paginatedEssays.length > 0 ? (
            <>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="hidden sm:table-cell">Título</TableHead>
                    <TableHead className="hidden lg:table-cell">Professor</TableHead>
                    <TableHead className="hidden md:table-cell">Data da Correção</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedEssays.map((essay) => (
                    <TableRow key={essay.id}>
                    <TableCell className="font-medium">{essay.studentName}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-xs truncate">{essay.title}</TableCell>
                    <TableCell className="hidden lg:table-cell">{essay.teacherName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <ClientOnly>
                        {essay.correctedAt ? format(essay.correctedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                        </ClientOnly>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewClick(essay)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizar Correção</span>
                        </Button>
                        {user && user.uid === essay.teacherId && (
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(essay)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar Correção</span>
                            </Button>
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
             <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            </>
            ) : (
            <div className="text-center py-12">
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum resultado encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tente ajustar seus filtros ou aguarde novas correções.
                </p>
            </div>
            )}
        </CardContent>
        </Card>

        {/* Render the modals */}
        <EditCorrectionModal
            isOpen={isEditModalOpen}
            onClose={handleEditModalClose}
            essay={selectedEssay}
            onCorrectionUpdated={handleCorrectionUpdated}
        />

        <CorrectionViewer 
            isOpen={isViewModalOpen}
            onOpenChange={handleViewModalOpenChange}
            essay={selectedEssay}
        />
    </>
  );
}
