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
import { FilePenLine, Inbox, Loader2 } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';

export type Essay = {
  id: string;
  studentId: string;
  studentName: string; // This will be populated after fetching the user
  title: string;
  submittedAt: Date; 
  [key: string]: any;
};

type TeacherEssayListProps = {
  onSelectEssay: (essay: Essay) => void;
};

export function TeacherEssayList({ onSelectEssay }: TeacherEssayListProps) {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEssays, setTotalEssays] = useState(0);

  const essaysPerPage = 25;

  const fetchEssays = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setIsLoading(true);
    try {
      let essaysQuery = query(
        collection(db, 'essays'),
        where('status', '==', 'sent'),
        orderBy('submittedAt', 'desc')
      );

      if (direction === 'next' && lastVisible) {
        essaysQuery = query(essaysQuery, startAfter(lastVisible), limit(essaysPerPage));
      } else if (direction === 'prev' && firstVisible) {
        essaysQuery = query(essaysQuery, endBefore(firstVisible), limit(essaysPerPage));
      } else {
        essaysQuery = query(essaysQuery, limit(essaysPerPage));
      }

      const essaySnapshots = await getDocs(essaysQuery);
      const essaysFromDB = essaySnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (Essay & { submittedAt: any })[]; // Intermediate type

      if (essaysFromDB.length > 0) {
        const studentIds = [...new Set(essaysFromDB.map(e => e.studentId))].filter(id => id);
        const studentNames = new Map<string, string>();

        if (studentIds.length > 0) {
            // FIX: Changed collection name from 'users' to 'students' to match firestore.rules
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
        }));

        setEssays(enrichedEssays);
        setLastVisible(essaySnapshots.docs[essaySnapshots.docs.length - 1]);
        setFirstVisible(essaySnapshots.docs[0]);

      } else {
        setEssays([]);
        if (direction !== 'initial') {
            direction === 'next' ? setCurrentPage(p => p - 1) : setCurrentPage(p => p + 1);
        }
      }
      
      const countQuery = query(collection(db, 'essays'), where('status', '==', 'sent'));
      const countSnapshot = await getDocs(countQuery);
      setTotalEssays(countSnapshot.size);

    } catch (error: any) {
      console.error("Error fetching essays: ", error); // This will now show the real permission error if any.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEssays();
  }, []);

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
    fetchEssays('next');
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => prev - 1);
    fetchEssays('prev');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redações para Corrigir</CardTitle>
        <CardDescription>
          {isLoading ? 'Buscando redações...' : `Você tem ${totalEssays} redação(ões) pendente(s) de correção.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : essays.length > 0 ? (
          <>
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
                        <ClientOnly>
                        {format(essay.submittedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </ClientOnly>
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
            <div className="flex justify-end items-center gap-4 mt-4">
                <span className="text-sm text-muted-foreground">Página {currentPage}</span>
                <Button onClick={handlePrevPage} disabled={currentPage === 1 || isLoading} size="sm">
                    Anterior
                </Button>
                <Button onClick={handleNextPage} disabled={essays.length < essaysPerPage || isLoading} size="sm">
                    Próximo
                </Button>
            </div>
          </>
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
