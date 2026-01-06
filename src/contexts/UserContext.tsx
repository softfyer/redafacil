'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Define a type for the user's role
export type UserRole = 'student' | 'teacher' | null;

interface UserContextType {
  user: User | null;
  userData: DocumentData | null;
  userRole: UserRole;
  isLoading: boolean; // To handle the loading state during role check
}

// Create the context with a default undefined value
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  // Effect for handling Firebase authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // When auth state is determined, we are no longer loading the initial user
      // but we will be loading their data next.
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for identifying user role and fetching data when the user object changes
  useEffect(() => {
    // If there is no user, reset states and stop loading.
    if (!user) {
      setUserData(null);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    // Start loading user data
    setIsLoading(true);
    const findUserRole = async () => {
      // 1. Check if the user is a student
      const studentDocRef = doc(db, 'students', user.uid);
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        setUserData(studentDoc.data());
        setUserRole('student');
        setIsLoading(false);
        return; // Found role, exit function
      }

      // 2. If not a student, check if the user is a teacher
      const teacherDocRef = doc(db, 'teachers', user.uid);
      const teacherDoc = await getDoc(teacherDocRef);
      if (teacherDoc.exists()) {
        setUserData(teacherDoc.data());
        setUserRole('teacher');
        setIsLoading(false);
        return; // Found role, exit function
      }

      // 3. If user is not in students or teachers collection
      setUserData(null);
      setUserRole(null);
      setIsLoading(false);
    };

    findUserRole();

  }, [user]); // This effect depends only on the user object

  const value = { user, userData, userRole, isLoading };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
