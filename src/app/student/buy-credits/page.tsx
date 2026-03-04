
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import AppHeader from '@/components/dashboard/AppHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  unit_amount: number | null;
  product: {
    name: string;
    description: string | null;
  };
}

export default function BuyCreditsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch('/api/stripe');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch products');
        }

        const data = await response.json();
        const validProducts = data.filter(
          (p: any) => p.unit_amount && p.product.name
        );
        setProducts(validProducts);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: priceId, userId: user.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader title="Comprar Créditos" />
      <main className="flex-1 p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            <p>Ocorreu um erro ao carregar os produtos:</p>
            <p className="font-mono text-sm bg-red-100 p-2 rounded mt-2">{error}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.product.name}</CardTitle>
                  {product.product.description && (
                    <CardDescription>
                      {product.product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(product.unit_amount! / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleCheckout(product.id)}
                    disabled={!!checkoutLoading}
                    className="w-full"
                  >
                    {checkoutLoading === product.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Comprar Agora
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

