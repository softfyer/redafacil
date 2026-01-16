'use client';

import AppHeader from "@/components/dashboard/AppHeader";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TeacherSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and the user is not a teacher, redirect.
    if (!isLoading && userRole !== 'teacher') {
      router.replace('/login');
    }
  }, [isLoading, userRole, router]);

  // While checking the user's role, show a loading screen.
  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Skeleton className="h-16 w-full" />
            <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  // If the user is identified as a teacher, show the teacher dashboard.
  if (userRole === 'teacher') {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Minhas Configurações" />
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </div>
    );
  }

  // If the user is not a teacher, render a loading skeleton while redirecting.
  return (
      <div className="flex flex-col min-h-screen">
          <Skeleton className="h-16 w-full" />
          <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-96 w-full" />
          </div>
      </div>
  );
}
