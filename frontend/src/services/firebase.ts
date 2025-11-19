import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'; 

let auth: Auth | undefined;
let db: Firestore | undefined;
let appId = 'default-app-id';
let initializationError: Error | null = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

try {
  // 1. Check for API Key specifically
  if (!firebaseConfig.apiKey) {
     throw new Error("Firebase API Key is missing. Check your .env file.");
  }

  // 2. Initialize
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = firebaseConfig.appId || 'default-app-id';

} catch (err: any) {
  console.error("CRITICAL: Firebase Initialization Failed", err);
  initializationError = err;
}

export { auth, db, appId, initializationError };