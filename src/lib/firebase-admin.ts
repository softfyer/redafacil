
import * as admin from 'firebase-admin';

// Garante que o SDK seja inicializado apenas uma vez.
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_CONFIG as string
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin initialization error', error.stack);
    throw new Error('Could not initialize Firebase Admin SDK. Check your FIREBASE_ADMIN_CONFIG environment variable.');
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
