
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface Payment {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  credits: number;
  paymentIntentId: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Timestamp;
}

const paymentsCollection = collection(db, 'payments');

/**
 * Saves a new payment record to Firestore.
 * @param payment - The payment object to save.
 * @returns The ID of the newly created payment document.
 */
export const createPayment = async (payment: Omit<Payment, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(paymentsCollection, payment);
    console.log("Payment record created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating payment record: ", error);
    throw new Error('Could not create payment record.');
  }
};

/**
 * Fetches all payments for a specific user, ordered by creation date.
 * @param userId - The ID of the user whose payments are to be fetched.
 * @returns A promise that resolves to an array of payment objects.
 */
export const getPaymentsByUserId = async (userId: string): Promise<Payment[]> => {
  try {
    const q = query(
      paymentsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const payments: Payment[] = [];
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() } as Payment);
    });
    return payments;
  } catch (error) {
    console.error("Error fetching payments: ", error);
    throw new Error('Could not fetch payments.');
  }
};
