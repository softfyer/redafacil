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
  updateDoc,
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
  status: 'pending' | 'corrected' | 'sent' | 'a corrigir';
  fileUrl: string;
  correctedFileUrl?: string;
  audioFeedbackUrl?: string;
  textFeedback?: string;
}

/**
 * Deletes a file from Firebase Storage based on its URL.
 * @param fileUrl The URL of the file to delete.
 */
export const deleteFileByUrl = async (fileUrl: string) => {
  if (!fileUrl) return;
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log(`Successfully deleted file: ${fileUrl}`);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`File not found, could not delete: ${fileUrl}`);
    } else {
      console.error(`Error deleting file: ${fileUrl}`, error);
      throw new Error('Failed to delete existing file.');
    }
  }
};

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
 * Updates an existing essay. If a new file is uploaded, the old one is deleted.
 * @param essayData The essay data to update, must include an ID.
 * @param newFileUrl Optional. The URL of the new file if it was replaced.
 * @param oldFileUrl Optional. The URL of the old file to be deleted.
 */
export const updateEssay = async (essayData: Essay, newFileUrl?: string, oldFileUrl?: string) => {
  if (!essayData.id) {
    throw new Error('An essay ID must be provided to update an essay.');
  }

  const batch = writeBatch(db);
  const essayDocRef = doc(db, 'essays', essayData.id);

  const dataToUpdate: any = { ...essayData };
  delete dataToUpdate.id; 
  
  if (newFileUrl) {
    dataToUpdate.fileUrl = newFileUrl;
  }

  batch.update(essayDocRef, dataToUpdate);

  try {
    // If a new file was uploaded and an old one existed, delete the old one
    if (newFileUrl && oldFileUrl) {
      await deleteFileByUrl(oldFileUrl);
    }
    
    await batch.commit();
    console.log('Essay updated successfully: ', essayData.id);

  } catch (error) {
    console.error('Error updating essay: ', error);
    throw new Error('Failed to update essay.');
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
