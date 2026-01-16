'use client';

import AppHeader from "@/components/dashboard/AppHeader";
import { useUser } from "@/contexts/UserContext";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StudentSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and the user is not a student, redirect.
    if (!isLoading && userRole !== 'student') {
      router.replace('/login');
    }
  }, [isLoading, userRole, router]);


  // 1. Show a loading screen while user role is being determined
  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Skeleton className="h-16 w-full" />
            <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  // Only proceed if the user is identified as a student
  if (userRole === 'student') {
    // 2. If student's email is not verified, show the verification card
    if (user && !user.emailVerified) {
      return <VerifyEmailCard />;
    }

    // 3. If student's email is verified, show the dashboard
    if (user && user.emailVerified) {
      return (
        <div className="flex flex-col min-h-screen">
          <AppHeader title="Minhas Configurações" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {children}
          </main>
        </div>
      );
    }
  }

  // 4. If the user is not a student, or any other case, render a loading state
  // or null while redirection occurs.
  return (
      <div className="flex flex-col min-h-screen">
          <Skeleton className="h-16 w-full" />
          <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-96 w-full" />
          </div>
      </div>
  );
}
