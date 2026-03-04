
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { getPaymentsByUserId, type Payment } from '@/lib/services/paymentService';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const PaymentsListSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Produto</TableHead>
        <TableHead className="hidden sm:table-cell">Status</TableHead>
        <TableHead className="hidden md:table-cell">Data</TableHead>
        <TableHead className="text-right">ID do Pagamento</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(3)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20 mt-1" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-40 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function PaymentsPage() {
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const userPayments = await getPaymentsByUserId(user.uid);
        setPayments(userPayments);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
        setError('Não foi possível carregar o histórico de pagamentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.uid]);

  return (
    <Card>
      <CardHeader className="px-7">
        <CardTitle>Meus Pagamentos</CardTitle>
        <CardDescription>
          Histórico de todas as suas compras de créditos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <PaymentsListSkeleton />
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Você ainda não fez nenhuma compra.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">ID do Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">{payment.productName}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                       {payment.amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant="outline">
                       {payment.status === 'completed' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                     {format(payment.createdAt.toDate(), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {payment.paymentIntentId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
