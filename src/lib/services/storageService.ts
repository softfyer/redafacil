'use client';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an original essay file to a specified path in Firebase Storage.
 * @param file The file to upload.
 * @param studentId The UID of the student, used to create a user-specific folder.
 * @returns A promise that resolves to the public download URL of the file.
 */
export const uploadEssayFile = async (file: File, studentId: string): Promise<string> => {
  if (!file) {
    throw new Error('A file must be provided to upload.');
  }
  if (!studentId) {
    throw new Error('A student ID must be provided to upload a file.');
  }

  // Create a unique file name to prevent overwrites
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `essays/${studentId}/${uniqueFileName}`;

  try {
    const storageRef = ref(storage, storagePath);
    console.log(`Uploading file to: ${storagePath}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File uploaded successfully! URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed. Please try again.');
  }
};

/**
 * Uploads a corrected essay file to a specified path in Firebase Storage.
 * @param file The corrected file to upload.
 * @param studentId The UID of the student.
 * @param essayId The ID of the essay document.
 * @returns A promise that resolves to the public download URL of the file.
 */
export const uploadCorrectedEssayFile = async (file: File, studentId: string, essayId: string): Promise<string> => {
    if (!file) {
        throw new Error('A file must be provided to upload.');
    }
    if (!studentId || !essayId) {
        throw new Error('Student ID and Essay ID must be provided.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${essayId}-corrected.${fileExtension}`;
    const storagePath = `essays/${studentId}/${fileName}`;

    try {
        const storageRef = ref(storage, storagePath);
        console.log(`Uploading corrected file to: ${storagePath}`);
        
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('Corrected file uploaded successfully! URL:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading corrected file:', error);
        throw new Error('Corrected file upload failed. Please try again.');
    }
};

/**
 * Uploads a feedback audio file (blob) to a specified path in Firebase Storage.
 * @param audioBlob The audio blob to upload.
 * @param studentId The UID of the student.
 * @param essayId The ID of the essay document.
 * @returns A promise that resolves to the public download URL of the audio file.
 */
export const uploadFeedbackAudio = async (audioBlob: Blob, studentId: string, essayId: string): Promise<string> => {
    if (!audioBlob) {
        throw new Error('An audio blob must be provided to upload.');
    }
    if (!studentId || !essayId) {
        throw new Error('Student ID and Essay ID must be provided.');
    }

    const fileName = `${essayId}-feedback.webm`; // Assuming webm format from recorder
    const storagePath = `essays/${studentId}/${fileName}`;

    try {
        const storageRef = ref(storage, storagePath);
        console.log(`Uploading audio feedback to: ${storagePath}`);

        const snapshot = await uploadBytes(storageRef, audioBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('Audio feedback uploaded successfully! URL:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading audio feedback:', error);
        throw new Error('Audio feedback upload failed. Please try again.');
    }
};
