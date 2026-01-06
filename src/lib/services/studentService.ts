import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface StudentData {
  uid: string;
  name: string;
  email: string;
}

export const addStudent = async (studentData: StudentData) => {
  try {
    const studentDocRef = doc(db, 'students', studentData.uid);
    await setDoc(studentDocRef, {
      ...studentData,
      createdAt: serverTimestamp(),
    });
    console.log('Student added successfully with UID as document ID!');
  } catch (error) {
    console.error('Error adding student: ', error);
    throw new Error('Failed to add student');
  }
};
