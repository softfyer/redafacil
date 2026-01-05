import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Feather, Award, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-landing');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Feather className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter">Redação Online</h1>
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
          <div className="max-w-3xl mx-auto">
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

        {heroImage && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
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
          </section>
        )}

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
              Como funciona?
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Um processo simples e eficaz para aprimorar suas habilidades de escrita.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">1. Envie sua Redação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Faça o upload do seu texto em PDF, DOCX ou imagem. É rápido e fácil.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-accent/10 text-accent p-3 rounded-full w-fit">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">2. Receba a Correção</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nossos professores corrigem seu texto, apontando melhorias e dando dicas valiosas.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                  <Award className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">3. Evolua e Conquiste</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use o feedback para evoluir e alcançar a excelência em seus próximos textos.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Redação Online. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
