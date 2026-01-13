'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LoginForm } from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';

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
            return;
          }

          // Verificar se é estudante
          const studentDocRef = doc(db, 'students', user.uid);
          const studentDocSnap = await getDoc(studentDocRef);
          if (studentDocSnap.exists()) {
            router.replace('/student/dashboard');
            return;
          }

          // Caso de usuário autenticado sem papel definido
          setIsVerifying(false);

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
    <div className="flex items-center justify-center min-h-screen p-4">
      <LoginForm />
    </div>
  );
}
