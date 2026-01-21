'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter, endBefore, DocumentData, QueryDocumentSnapshot, documentId } from 'firebase/firestore';
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
import { CheckCircle, Inbox, Loader2, Search, Edit, Eye } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EditCorrectionModal } from './EditCorrectionModal'; // Import the modal
import { CorrectionViewer } from '@/components/dashboard/student/CorrectionViewer';
import type { Essay } from '@/lib/services/essayService'; // Ensure type is imported
import { useUser } from '@/contexts/UserContext';

// Enrich the Essay type for local state management
export type EnrichedEssay = Essay & {
  studentName: string;
  submittedAt: Date;
  correctedAt?: Date;
  teacherName?: string;
};

export function CorrectedEssayList() {
  const [essays, setEssays] = useState<EnrichedEssay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalEssays, setTotalEssays] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEssay, setSelectedEssay] = useState<EnrichedEssay | null>(null);
  const { user } = useUser();

  // Using useCallback for a stable function reference
  const fetchCorrectedEssays = useCallback(async () => {
    setIsLoading(true);
    try {
      const countQuery = query(collection(db, 'essays'), where('status', '==', 'corrected'));
      const countSnapshot = await getDocs(countQuery);
      setTotalEssays(countSnapshot.size);

      if (countSnapshot.empty) {
        setEssays([]);
        return;
      }

      const essaysQuery = query(
        collection(db, 'essays'),
        where('status', '==', 'corrected'),
        orderBy('correctedAt', 'desc'),
        limit(20) // Increased limit for better visibility
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
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchCorrectedEssays();
  }, [fetchCorrectedEssays]);

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

  const filteredEssays = essays.filter(
    (essay) =>
      essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (essay.studentName && essay.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (essay.teacherName && essay.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Redações Corrigidas</CardTitle>
            <CardDescription>
            {isLoading ? 'Buscando histórico...' : `Total de ${totalEssays} redação(ões) corrigida(s).`}
            </CardDescription>
            <div className="relative pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Pesquisar por título, aluno ou professor..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
            />
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : filteredEssays.length > 0 ? (
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
                {filteredEssays.map((essay) => (
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
            ) : (
            <div className="text-center py-12">
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma redação corrigida</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                O histórico de redações que você corrigiu aparecerá aqui.
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
