
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export interface StudentData {
  uid: string;
  name: string;
  email: string;
  credits?: number;
  createdAt: any;
}

export const studentService = {
  async getStudent(studentId: string): Promise<StudentData | null> {
    try {
      const studentDocRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentDocRef);

      if (studentDoc.exists()) {
        return studentDoc.data() as StudentData;
      } else {
        console.log('No such student!');
        return null;
      }
    } catch (error) {
      console.error('Error getting student: ', error);
      throw new Error('Failed to get student');
    }
  },

  async addStudent(studentData: Omit<StudentData, 'createdAt' | 'credits'>) {
    try {
      const studentDocRef = doc(db, 'students', studentData.uid);
      await setDoc(studentDocRef, {
        ...studentData,
        credits: 0, // Initialize with 0 credits
        createdAt: serverTimestamp(),
      });
      console.log('Student added successfully with UID as document ID!');
    } catch (error) {
      console.error('Error adding student: ', error);
      throw new Error('Failed to add student');
    }
  },

  async addCredit(studentId: string, amount: number) {
    try {
      const studentDocRef = doc(db, 'students', studentId);
      await updateDoc(studentDocRef, {
        credits: increment(amount)
      });
      console.log(`Added ${amount} credit(s) to student ${studentId}`);
    } catch (error) {
      console.error('Error adding credit: ', error);
      throw new Error('Failed to add credit');
    }
  },

  async removeCredit(studentId: string, amount: number) {
    try {
      const studentDocRef = doc(db, 'students', studentId);
      await updateDoc(studentDocRef, {
        credits: increment(-amount)
      });
      console.log(`Removed ${amount} credit(s) from student ${studentId}`);
    } catch (error) {
      console.error('Error removing credit: ', error);
      throw new Error('Failed to remove credit');
    }
  }
};
