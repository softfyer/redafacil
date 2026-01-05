'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, DollarSign } from 'lucide-react';
import { useState } from 'react';

type PaymentModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPaymentSuccess: () => void;
};

export function PaymentModal({ isOpen, onOpenChange, onPaymentSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMockPayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onPaymentSuccess();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Adquirir Crédito de Correção</DialogTitle>
          <DialogDescription className="text-center">
            Para enviar uma redação, você precisa de um crédito.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
            <span className="font-medium">1 Crédito de Correção</span>
            <span className="font-bold text-lg">R$ 15,00</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Este é um ambiente de demonstração. Clique abaixo para simular o pagamento.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleMockPayment} className="w-full" disabled={isLoading}>
            {isLoading ? 'Processando...' : 'Simular Pagamento com Cartão'}
            {!isLoading && <CreditCard className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
