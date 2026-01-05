'use client';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

// Based on src/lib/placeholder-data.ts
export interface Essay {
  id?: string; // Firestore ID
  studentId: string;
  title: string;
  topic: string;
  textType: string;
  targetExam: string;
  promptCommands: string;
  submittedAt?: any; // Keep as any for serverTimestamp compatibility
  status: 'pending' | 'corrected' | 'sent';
  fileUrl: string;
  correctedFileUrl?: string;
  audioFeedbackUrl?: string;
  textFeedback?: string;
}

/**
 * Adds a new essay to the root "essays" collection.
 * @param studentId The UID of the student.
 * @param essayData The essay data to add.
 */
export const addEssay = async (studentId: string, essayData: Omit<Essay, 'id' | 'studentId' | 'submittedAt'>) => {
  if (!studentId) {
    throw new Error('A student ID must be provided to add an essay.');
  }
  try {
    const essaysCollection = collection(db, 'essays');
    const docRef = await addDoc(essaysCollection, {
      ...essayData,
      studentId: studentId,
      submittedAt: serverTimestamp(),
    });
    console.log('Essay added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding essay: ', error);
    throw new Error('Failed to add essay to the new collection.');
  }
};

/**
 * Fetches all essays for a specific student from the root "essays" collection.
 * @param studentId The UID of the student.
 * @returns A promise that resolves to an array of essays.
 */
export const getEssaysForStudent = async (studentId: string): Promise<Essay[]> => {
  if (!studentId) {
    return [];
  }
  try {
    const essaysCollection = collection(db, 'essays');
    const q = query(
      essaysCollection,
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const essays = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate(),
        } as Essay;
    });

    return essays;
  } catch (error) {
    console.error('Error fetching essays: ', error);
    // This will now require a composite index. The error message will guide the user.
    throw new Error('Failed to fetch essays. You may need to create a composite index in Firestore. Check the console for a link.');
  }
};

/**
 * Deletes an essay document from Firestore and its corresponding file from Storage.
 * @param essay The essay object to delete.
 */
export const deleteEssay = async (essay: Essay) => {
  if (!essay.id || !essay.fileUrl) {
    throw new Error('Essay ID and File URL are required for deletion.');
  }

  try {
    // 1. Delete the document from Firestore
    const essayDocRef = doc(db, 'essays', essay.id);
    await deleteDoc(essayDocRef);

    // 2. Delete the file from Firebase Storage
    const fileRef = ref(storage, essay.fileUrl);
    await deleteObject(fileRef);

    console.log(`Successfully deleted essay ${essay.id} and its file.`);

  } catch (error) {
    console.error("Error deleting essay:", error);
    // Handle cases where the file might not exist or other permission issues
    if ((error as any).code === 'storage/object-not-found') {
        console.warn("File not found in storage, but continuing to delete Firestore entry.")
    } else {
        throw new Error('Failed to delete the essay. Please try again.');
    }
  }
};
