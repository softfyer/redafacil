'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Feather, Award, UploadCloud, CreditCard, ShoppingBag, GraduationCap, Youtube } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ClientOnly } from '@/components/ui/client-only';
import { useRedirectIfAuthenticated } from '@/hooks/useRedirectIfAuthenticated';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';

export default function Home() {
  useRedirectIfAuthenticated();
  const { isLoading } = useUser();
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-landing');
  const profImage = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

  // While checking auth state, show a loading skeleton to prevent flashes of content
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
          <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-4">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-28" />
              </div>
          </header>
          <main className="flex-1">
              <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
                  <div className="max-w-3xl mx-auto space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-8 w-3/4 mx-auto" />
                      <Skeleton className="h-12 w-48 mx-auto" />
                  </div>
              </section>
              <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <Skeleton className="aspect-[16/9] md:aspect-[2/1] rounded-2xl w-full" />
              </section>
          </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Feather className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter">RedaFácil</h1>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Cadastre-se</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 font-headline">
              Eleve sua escrita a um novo patamar.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Receba correções detalhadas de professores especialistas e conquiste a nota máxima em sua redação.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Começar agora</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            {heroImage && (
                <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        className="object-cover"
                        data-ai-hint={heroImage.imageHint}
                        priority
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
            )}
        </section>

        <section id="how-it-works" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 animate-in fade-in delay-200 duration-500">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
              Como funciona?
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Um processo simples e eficaz para aprimorar suas habilidades de escrita.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center transition-transform duration-300 hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                  <CreditCard className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">1. Compre Créditos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Adquira créditos para submeter suas redações. Cada crédito vale uma correção.
                </p>
                 <Button variant="link" asChild className="mt-2">
                    <Link href="#plans">Ver planos</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center transition-transform duration-300 hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">2. Envie sua Redação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Faça o upload do seu texto em PDF, DOCX ou imagem. É rápido e fácil.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center transition-transform duration-300 hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-accent/10 text-accent p-3 rounded-full w-fit">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">3. Receba a Correção</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nossos professores corrigem seu texto, apontando melhorias e dando dicas valiosas.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center transition-transform duration-300 hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                  <Award className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">4. Evolua e Conquiste</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use o feedback para evoluir e alcançar a excelência em seus próximos textos.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-muted dark:bg-card py-20 md:py-32 animate-in fade-in delay-400 duration-500">
            <div className="container mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-12 lg:px-8">
                {profImage && (
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl shadow-lg">
                    <Image
                      src={profImage.imageUrl}
                      alt={profImage.description}
                      fill
                      className="object-cover"
                      data-ai-hint={profImage.imageHint}
                    />
                  </div>
                )}
                <div className="text-center md:text-left">
                  <div className="mx-auto md:mx-0 bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
                    Professores Especializados
                  </h3>
                  <p className="text-muted-foreground mt-4 text-lg">
                    Nossa banca de correção é composta por profissionais reais que já trabalharam em correções de vestibulares e diversos concursos.
                  </p>
                </div>
            </div>
        </section>

        <section id="plans" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 animate-in fade-in delay-600 duration-500">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
              Planos de Créditos
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Cada crédito permite a você ter a correção de uma redação. Escolha o plano ideal para você.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="flex flex-col text-center">
              <CardHeader>
                <CardTitle className="text-2xl">1 Crédito</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-5xl font-extrabold mb-2">R$ 19,90</p>
              </CardContent>
              <CardFooter className="flex-col">
                <Button className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Comprar
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex flex-col text-center border-2 border-primary shadow-lg relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Popular</Badge>
              <CardHeader>
                <CardTitle className="text-2xl">3 Créditos</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-5xl font-extrabold mb-2">R$ 49,90</p>
                <p className="text-muted-foreground">Economize 15%</p>
              </CardContent>
              <CardFooter className="flex-col">
                <Button className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Comprar
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex flex-col text-center">
              <CardHeader>
                <CardTitle className="text-2xl">5 Créditos</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-5xl font-extrabold mb-2">R$ 74,90</p>
                <p className="text-muted-foreground">Economize 25%</p>
              </CardContent>
              <CardFooter className="flex-col">
                <Button className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Comprar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center animate-in fade-in delay-800 duration-500">
            <div className="max-w-3xl mx-auto">
                <Youtube className="mx-auto h-16 w-16 text-primary mb-6" />
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">Fique por dentro das melhores dicas</h3>
                <p className="text-muted-foreground mt-4 text-lg mb-8">
                    Acompanhe nosso canal no YouTube para temas, análises e dicas de redação que vão te ajudar a chegar na nota máxima.
                </p>
                <Button size="lg" asChild>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                        <Youtube className="mr-2 h-5 w-5" />
                        Acessar Canal
                    </a>
                </Button>
            </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t">
        <div className="text-center text-sm text-muted-foreground">
          © <ClientOnly>{new Date().getFullYear()}</ClientOnly> RedaFácil. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
