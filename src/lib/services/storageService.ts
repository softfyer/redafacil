'use client';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to a specified path in Firebase Storage.
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
