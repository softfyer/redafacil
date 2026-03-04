"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Gem } from "lucide-react";
import AppHeader from "@/components/dashboard/AppHeader";
import { Button } from "@/components/ui/button";
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Product {
  id: string;
  unit_amount: number;
  product: {
    name: string;
    description: string;
  };
}

export default function BuyCreditsPage() {
  const router = useRouter();
  const { user, refreshUserData } = useUser();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    async function getProducts() {
      try {
        setLoading(true);
        const response = await fetch('/api/stripe');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast({
          title: "Erro ao buscar produtos",
          description: "Não foi possível carregar os produtos. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, [toast]);

  const handleCheckout = async (priceId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { id } = await response.json();
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: id });
        if (error) {
            throw new Error(error.message)
        }
      }
    } catch (error) {
      console.error("Erro ao realizar checkout:", error);
      toast({
        title: "Erro ao realizar checkout",
        description: "Não foi possível iniciar o processo de pagamento. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Créditos para Correção</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Adquira créditos para receber correções detalhadas em suas redações.
        </p>

        {loading && (
          <div className="flex items-center justify-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="p-6 bg-card rounded-xl border shadow-lg flex flex-col">
              <div className="mb-4">
                <p className="text-xl font-bold text-primary">{product.product.name}</p>
                <p className="text-sm text-muted-foreground">{product.product.description}</p>
              </div>
              <div className="my-6">
                <p className="text-4xl font-extrabold">R$ {(product.unit_amount / 100).toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground mt-1">Pagamento único</p>
              </div>
              <Button onClick={() => handleCheckout(product.id)} disabled={loading} className="w-full mt-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Comprar Crédito
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}