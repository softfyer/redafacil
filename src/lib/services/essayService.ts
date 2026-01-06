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
  correctedAt?: any; // Timestamp for when the correction was submitted
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
 * Updates an existing essay. If a new file is provided, it deletes the old one.
 * @param essay The full essay object, including its ID.
 * @param newFileUrl The URL of the newly uploaded file, if any.
 * @param oldFileUrl The URL of the old file to be deleted if a new one was uploaded.
 */
export const updateEssay = async (essay: Essay, newFileUrl?: string, oldFileUrl?: string) => {
  if (!essay.id) {
    throw new Error('An essay ID must be provided to update an essay.');
  }

  const batch = writeBatch(db);
  const essayDocRef = doc(db, 'essays', essay.id);

  // If a new file was uploaded, the old file should be deleted.
  if (newFileUrl && oldFileUrl) {
    await deleteFileByUrl(oldFileUrl);
  }
  
  // Data to update, excluding id
  const { id, ...essayData } = essay;

  batch.update(essayDocRef, {
    ...essayData,
    fileUrl: newFileUrl || oldFileUrl, // Use new URL or keep the old one
  });

  try {
    await batch.commit();
    console.log(`Essay ${essay.id} updated successfully.`);
  } catch (error) {
    console.error('Error updating essay: ', error);
    throw new Error('Failed to update essay.');
  }
};

/**
 * Submits a correction for an essay.
 * @param essayId The ID of the essay to update.
 * @param correctionData The correction data, including feedback and URLs.
 */
export const submitCorrection = async (essayId: string, correctionData: {
  textFeedback: string;
  audioFeedbackUrl?: string;
  correctedFileUrl?: string;
}) => {
    if (!essayId) {
        throw new Error('An essay ID must be provided to submit a correction.');
    }

    try {
        const essayDocRef = doc(db, 'essays', essayId);

        const updateData = {
            ...correctionData,
            status: 'corrected' as const, // Explicitly type the status
            correctedAt: serverTimestamp(),
        };

        await updateDoc(essayDocRef, updateData);

        console.log('Correction submitted successfully for essay: ', essayId);

    } catch (error) {
        console.error('Error submitting correction: ', error);
        throw new Error('Failed to submit correction.');
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
