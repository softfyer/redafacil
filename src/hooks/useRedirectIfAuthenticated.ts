'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

/**
 * Hook that redirects authenticated users away from public pages (like login, register, home)
 * to their respective dashboards.
 */
export const useRedirectIfAuthenticated = () => {
  const { userRole, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // We don't want to redirect while the user's role is still being determined.
    if (isLoading) {
      return;
    }

    // If a user role is determined, it means they are logged in.
    if (userRole === 'student') {
      router.replace('/student/dashboard');
    } else if (userRole === 'teacher') {
      router.replace('/teacher/dashboard');
    }

    // If userRole is null, it means the user is not logged in, so we do nothing.
    
  }, [userRole, isLoading, router]);
};
