'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Importa o 'auth' do firebase
import { format } from 'date-fns';

import AppHeader from '@/components/dashboard/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Payment {
  id: string;
  productName: string;
  credits: number;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: any; 
  paymentIntentId: string | { [key: string]: any };
}

const PaymentsPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Observador para o estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Limpa o observador ao desmontar
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'payments'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const paymentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Payment, 'id'>),
        }));
        setPayments(paymentsData);
      } catch (err) {
        console.error("Error fetching payments: ", err);
        setError('Falha ao carregar o histórico de pagamentos.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchPayments();
    } else {
        // Se o usuário não estiver logado após a verificação inicial, paramos o loading.
        setLoading(false);
    }
  }, [user]);

  const renderSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-10" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-32" /></TableCell>
    </TableRow>
  );

  const getPaymentIntentIdString = (intentId: string | { [key: string]: any }): string => {
    if (typeof intentId === 'string') {
      return intentId;
    }
    if (intentId && typeof intentId === 'object' && 'id' in intentId) {
      return (intentId as { id: string }).id;
    }
    return 'ID Inválido';
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader title="Meus Pagamentos" />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 md:p-10">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Compras</CardTitle>
            <CardDescription>Aqui está a lista de todas as suas transações.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">ID da Transação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {renderSkeleton()}
                    {renderSkeleton()}
                    {renderSkeleton()}
                  </>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-500">{error}</TableCell>
                  </TableRow>
                ) : user && payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.productName}</div>
                      </TableCell>
                      <TableCell>{payment.credits}</TableCell>
                      <TableCell>{(payment.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {payment.createdAt && format(payment.createdAt.toDate(), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {getPaymentIntentIdString(payment.paymentIntentId)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {user ? 'Nenhum pagamento encontrado.' : 'Por favor, faça login para ver seus pagamentos.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentsPage;
