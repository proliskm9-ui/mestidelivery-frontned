/**
 * Firebase client config.
 *
 * Roles are stored in Firestore documents (users / admins / partners), not Custom Claims.
 * Reason: Custom Claims need a Cloud Function to set on account creation; Firestore role
 * docs work on Spark plan without Cloud Functions and match the existing manual
 * admin/partner account creation flow described in the auth prompt.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'mestidelivery',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
