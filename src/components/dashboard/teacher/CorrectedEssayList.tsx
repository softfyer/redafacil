'use client';

import React, { useState, useEffect } from 'react';
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
import { CheckCircle, Inbox, Loader2, Search } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Re-using the Essay type, assuming it will be enriched with studentName
export type Essay = {
  id: string;
  studentId: string;
  studentName: string; // This will be populated after fetching the user
  title: string;
  submittedAt: Date;
  correctedAt?: Date; // Add correctedAt for display
  [key: string]: any;
};

export function CorrectedEssayList() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEssays, setTotalEssays] = useState(0);

  const essaysPerPage = 10;

  useEffect(() => {
    const fetchCorrectedEssays = async () => {
      setIsLoading(true);
      try {
        const countQuery = query(collection(db, 'essays'), where('status', '==', 'corrected'));
        const countSnapshot = await getDocs(countQuery);
        setTotalEssays(countSnapshot.size);

        if (countSnapshot.empty) {
          setEssays([]);
          setIsLoading(false);
          return;
        }

        const essaysQuery = query(
          collection(db, 'essays'),
          where('status', '==', 'corrected'),
          orderBy('correctedAt', 'desc'), // Order by correction date
          limit(essaysPerPage)
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
              correctedAt: essay.correctedAt?.toDate(), // Convert correctedAt timestamp
          }));

          setEssays(enrichedEssays);
          setLastVisible(essaySnapshots.docs[essaySnapshots.docs.length - 1]);
        } else {
          setEssays([]);
        }
      } catch (error) {
        console.error("Error fetching corrected essays: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCorrectedEssays();
  }, []); // Initial fetch

  // Note: For simplicity, pagination and search are not fully re-implemented here.
  // The component structure is ready for them to be added.
  const filteredEssays = essays.filter(
    (essay) =>
      essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (essay.studentName && essay.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redações Corrigidas</CardTitle>
        <CardDescription>
          {isLoading ? 'Buscando histórico...' : `Você já corrigiu ${totalEssays} redação(ões).`}
        </CardDescription>
        <div className="relative pt-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título ou aluno..."
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
                <TableHead className="hidden md:table-cell">Data da Correção</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEssays.map((essay) => (
                <TableRow key={essay.id}>
                  <TableCell className="font-medium">{essay.studentName}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-xs truncate">{essay.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ClientOnly>
                      {essay.correctedAt ? format(essay.correctedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </ClientOnly>
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
        ) : (
          <div className="text-center py-12">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma redação corrigida</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              O histórico de redações que você corrigiu aparecerá aqui.
            </p>
          </div>
        )}
        {/* Pagination controls can be added here based on totalEssays and essaysPerPage */}
      </CardContent>
    </Card>
  );
}
