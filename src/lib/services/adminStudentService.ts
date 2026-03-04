
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Adds a specified number of credits to a student's account using Admin privileges.
 * This function should only be called from a secure server-side environment.
 *
 * @param userId - The ID of the student to add credits to.
 * @param creditsToAdd - The number of credits to add.
 */
const addCredit = async (userId: string, creditsToAdd: number): Promise<void> => {
  if (!userId) {
    throw new Error('User ID must be provided to add credits.');
  }
  if (creditsToAdd <= 0) {
    throw new Error('The number of credits to add must be positive.');
  }

  const studentRef = adminDb.collection('students').doc(userId);

  try {
    await studentRef.update({
      credits: FieldValue.increment(creditsToAdd),
    });
    console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
  } catch (error) {
    console.error(`Failed to add credits to user ${userId}:`, error);
    // Rethrow the error to be handled by the calling function (e.g., the webhook)
    throw new Error(`Could not update credits for user ${userId}.`);
  }
};

export const adminStudentService = {
  addCredit,
};
