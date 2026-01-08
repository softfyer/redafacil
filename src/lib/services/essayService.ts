'use client';

import { db } from '@/lib/firebase';
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
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { deleteFileByUrl } from './storageService'; // Import from storageService

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
    // Explicitly remove id from essayData to prevent Firestore errors
    const { id, ...restOfEssayData } = essayData as any;
    const docRef = await addDoc(essaysCollection, {
      ...restOfEssayData,
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

  const essayDocRef = doc(db, 'essays', essay.id);

  // If a new file was uploaded and there was an old file, delete the old file.
  if (newFileUrl && oldFileUrl && newFileUrl !== oldFileUrl) {
    try {
      await deleteFileByUrl(oldFileUrl);
    } catch (error) {
      console.error(`Failed to delete old file ${oldFileUrl}:`, error);
      // Log the error but continue with the update
    }
  }

  // Prepare the data for the update, removing the id from the object itself.
  const { id, ...dataToUpdate } = essay;

  try {
    await updateDoc(essayDocRef, dataToUpdate);
    console.log(`Essay ${essay.id} updated successfully.`);
  } catch (error) {
    console.error('Error updating essay: ', error);
    throw new Error('Failed to update essay.');
  }
};


/**
 * Fetches all essays for a given student.
 * @param studentId The UID of the student.
 * @returns A promise that resolves to an array of essays.
 */
export const getEssaysByStudent = async (studentId: string): Promise<Essay[]> => {
  console.log("Fetching essays for student ID:", studentId);
  try {
    const q = query(
      collection(db, 'essays'),
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const essays = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Essay[];
    console.log("Fetched essays count:", essays.length);
    return essays;
  } catch (error) {
    console.error('Error fetching student essays: ', error);
    throw new Error('Failed to fetch student essays.');
  }
};

export const getEssaysToCorrect = async (): Promise<Essay[]> => {
  try {
    const q = query(
      collection(db, 'essays'),
      where('status', '==', 'a corrigir'),
      orderBy('submittedAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Essay[];
  } catch (error) {
    console.error('Error fetching essays to correct: ', error);
    throw new Error('Failed to fetch essays to correct.');
  }
};

export const getCorrectedEssays = async (): Promise<Essay[]> => {
  try {
    const q = query(
      collection(db, 'essays'),
      where('status', '==', 'corrected'),
      orderBy('correctedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Essay[];
  } catch (error) {
    console.error('Error fetching corrected essays: ', error);
    throw new Error('Failed to fetch corrected essays.');
  }
};

export const submitCorrection = async (essayId: string, correctionData: {
  correctedFileUrl?: string;
  audioFeedbackUrl?: string;
  textFeedback?: string;
}) => {
  try {
    const essayDocRef = doc(db, 'essays', essayId);
    await updateDoc(essayDocRef, {
      ...correctionData,
      status: 'corrected',
      correctedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error submitting correction: ', error);
    throw new Error('Failed to submit correction.');
  }
};

// New function to delete an essay and its associated files
export const deleteEssay = async (essay: Essay) => {
  if (!essay.id) {
    throw new Error('Essay ID is missing.');
  }

  const batch = writeBatch(db);

  // 1. Delete the essay document
  const essayDocRef = doc(db, 'essays', essay.id);
  batch.delete(essayDocRef);

  // 2. Delete the original file from Storage
  if (essay.fileUrl) {
    try {
      await deleteFileByUrl(essay.fileUrl);
    } catch (error) {
      console.error(`Failed to delete original file ${essay.fileUrl}:`, error);
      // Decide if you want to stop the whole process if a file deletion fails
      // For now, we'll log the error and continue
    }
  }

  // 3. Delete the corrected file from Storage
  if (essay.correctedFileUrl) {
    try {
      await deleteFileByUrl(essay.correctedFileUrl);
    } catch (error) {
      console.error(`Failed to delete corrected file ${essay.correctedFileUrl}:`, error);
    }
  }

  // 4. Delete the audio feedback from Storage
  if (essay.audioFeedbackUrl) {
    try {
      await deleteFileByUrl(essay.audioFeedbackUrl);
    } catch (error) {
      console.error(`Failed to delete audio feedback ${essay.audioFeedbackUrl}:`, error);
    }
  }

  // Commit the batch
  try {
    await batch.commit();
  } catch (error) {
    console.error('Error deleting essay and associated files: ', error);
    throw new Error('Failed to delete essay.');
  }
};
