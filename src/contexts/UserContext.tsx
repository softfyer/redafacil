'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserContextType {
  user: User | null;
  userData: DocumentData | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);

  // Effect for handling authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup the auth subscription on component unmount
    return () => unsubscribeAuth();
  }, []);

  // Effect for handling Firestore snapshot based on the user's state
  useEffect(() => {
    // If there is no user, clear user data and do nothing
    if (!user) {
      setUserData(null);
      return;
    }

    // If a user is logged in, create the snapshot listener
    const userDocRef = doc(db, 'students', user.uid);
    const unsubscribeSnapshot = onSnapshot(userDocRef, 
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          console.log('User document not found!');
          setUserData(null);
        }
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        setUserData(null);
      }
    );

    // Cleanup function: This will be called when the user logs out (user object changes)
    // or when the component unmounts. This prevents the permission-denied error.
    return () => unsubscribeSnapshot();
  }, [user]); // Dependency array ensures this effect runs whenever the user object changes

  return (
    <UserContext.Provider value={{ user, userData }}>
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
