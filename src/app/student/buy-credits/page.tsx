"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { studentService } from "@/lib/services/studentService";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Gem } from "lucide-react";
import AppHeader from "@/components/dashboard/AppHeader";
import { Button } from "@/components/ui/button";

export default function BuyCreditsPage() {
  const router = useRouter();
  const { user, refreshUserData } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'success' | 'failure' | null>(null);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  const simulateSuccessWebhook = async () => {
    if (!user || loading) return;
    setLoading('success');
    try {
      await studentService.addCredit(user.uid, 1);
      if (refreshUserData) {
        await refreshUserData();
      }
      toast({
        title: "Webhook Simulado: Sucesso!",
        description: "Pagamento confirmado e 1 crédito foi adicionado à sua conta.",
      });
      router.push("/student/dashboard");
    } catch (error) {
      console.error("Erro ao simular sucesso de webhook:", error);
      toast({
        title: "Erro na Simulação",
        description: "Não foi possível concluir a simulação de sucesso.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const simulateFailureWebhook = async () => {
    if (loading) return;
    setLoading('failure');

    toast({
      title: "Webhook Simulado: Falha",
      description: "O pagamento foi recusado. Nenhum crédito foi adicionado.",
      variant: "destructive",
    });

    // Simulate a delay to show the loading state and let the user read the toast
    setTimeout(() => {
      setLoading(null);
    }, 1500);
  };

  if (user === undefined) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader title="Comprar Créditos" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader title="Comprar Créditos" />
      <main className="flex-1 flex flex-col justify-center items-center p-4 text-center">
        <Gem className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Crédito Avulso</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Adquira um crédito para receber uma correção detalhada na sua redação.
        </p>

        {/* Product Card */}
        <div className="w-full max-w-xs mt-8 p-6 bg-card rounded-xl border shadow-lg">
          <div className="mb-4">
            <p className="text-xl font-bold text-primary">Crédito Avulso</p>
            <p className="text-sm text-muted-foreground">1 correção de redação</p>
          </div>
          <div className="my-6">
            <p className="text-4xl font-extrabold">R$ 5,00</p>
            <p className="text-xs text-muted-foreground mt-1">Pagamento único</p>
          </div>
        </div>

        {/* Webhook Simulation Buttons */}
        <div className="mt-8 w-full max-w-xs">
            <p className="text-sm text-muted-foreground mb-4 text-center">
                Simular resposta do webhook do Stripe:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={simulateSuccessWebhook}
                    disabled={!!loading}
                    className="w-full"
                >
                    {loading === 'success' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simular Sucesso
                </Button>
                <Button
                    onClick={simulateFailureWebhook}
                    disabled={!!loading}
                    className="w-full"
                    variant="destructive"
                >
                    {loading === 'failure' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simular Falha
                </Button>
            </div>
        </div>

      </main>
    </div>
  );
}