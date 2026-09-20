import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';

const env = (import.meta as any).env || {};

// Firebase configuration supporting both firebase-applet-config.json and Vite environment variables
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || '',
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || '(default)'
};

// Initialize Firebase App instance safely (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);

export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Verify live connection to Firestore upon startup
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ [Firebase Firestore] Connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('⚠️ [Firebase Firestore] Client appears offline or pending network sync.');
    } else {
      console.log('ℹ️ [Firebase Firestore] Connected to project:', firebaseConfig.projectId);
    }
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}
