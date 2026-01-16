'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'student' | 'teacher' | null;

interface UserContextType {
  user: User | null;
  userData: DocumentData | null;
  userRole: UserRole;
  isLoading: boolean;
  refreshUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRoleAndData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUserData(null);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const studentDocRef = doc(db, 'students', currentUser.uid);
    const teacherDocRef = doc(db, 'teachers', currentUser.uid);

    try {
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        setUserData(studentDoc.data());
        setUserRole('student');
      } else {
        const teacherDoc = await getDoc(teacherDocRef);
        if (teacherDoc.exists()) {
          setUserData(teacherDoc.data());
          setUserRole('teacher');
        } else {
          setUserData(null);
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchUserRoleAndData(currentUser);
    });
    return () => unsubscribeAuth();
  }, [fetchUserRoleAndData]);

  const refreshUserData = useCallback(() => {
    if (user) {
      fetchUserRoleAndData(user);
    }
  }, [user, fetchUserRoleAndData]);

  const value = { user, userData, userRole, isLoading, refreshUserData };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
