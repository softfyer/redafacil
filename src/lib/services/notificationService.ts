'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  writeBatch
} from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  essayId: string;
  createdAt: any; // Firestore Server Timestamp
}

/**
 * Creates a notification for a new essay submission.
 * @param essayTitle The title of the essay.
 * @param essayId The ID of the essay document.
 */
export const createEssayNotification = async (essayTitle: string, essayId: string) => {
  try {
    const notificationsCollection = collection(db, 'notifications');
    await addDoc(notificationsCollection, {
      message: `Nova redação "${essayTitle}" está disponível para correção.`,
      essayId: essayId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification: ', error);
    // This is a non-critical action, so we don't re-throw the error.
  }
};

/**
 * Fetches all notifications, ordered by most recent.
 * @returns A promise that resolves to an array of notifications.
 */
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications: ', error);
    throw new Error('Failed to fetch notifications.');
  }
};

/**
 * Deletes all notifications from the collection.
 * This is used to "mark all as read" by destroying them.
 */
export const deleteAllNotifications = async () => {
  const batch = writeBatch(db);
  const q = query(collection(db, 'notifications'));
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return; // Nothing to delete
    }
    
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${querySnapshot.size} notifications.`);
  } catch (error) {
    console.error('Error deleting notifications: ', error);
    throw new Error('Failed to delete notifications.');
  }
};
