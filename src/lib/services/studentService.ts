import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface StudentData {
  uid: string;
  name: string;
  email: string;
}

export const addStudent = async (studentData: StudentData) => {
  try {
    const studentsCollection = collection(db, 'students');
    await addDoc(studentsCollection, {
      ...studentData,
      createdAt: serverTimestamp(),
    });
    console.log('Student added successfully!');
  } catch (error) {
    console.error('Error adding student: ', error);
    throw new Error('Failed to add student');
  }
};
