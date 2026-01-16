'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LoginForm } from '@/components/auth/LoginForm';
import { Feather, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Componente de loader em tela cheia
const AuthLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="mt-4 text-muted-foreground">Verificando sua sessão...</p>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário está logado, verificar seu papel e redirecionar
        try {
          // Verificar se é professor
          const teacherDocRef = doc(db, 'teachers', user.uid);
          const teacherDocSnap = await getDoc(teacherDocRef);
          if (teacherDocSnap.exists()) {
            router.replace('/teacher/dashboard');
          } else {
            // Senão, é estudante
            router.replace('/student/dashboard');
          }
        } catch (error) {
                   // Em caso de erro, mostrar a página de login como fallback
                   console.error("Erro ao verificar autenticação:", error);
                   setIsVerifying(false);
                }
              } else {
                // Usuário não está logado, mostrar formulário de login
                setIsVerifying(false);
              }
            });
        
            // Limpar a inscrição no desmontar
            return () => unsubscribe();
          }, [router]);
        
          if (isVerifying) {
            return <AuthLoader />;
          }
        
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Feather className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-bold">RedaFácil</CardTitle>
            </div>
          <CardDescription>
            Insira suas credenciais para entrar no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
