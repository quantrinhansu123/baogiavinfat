// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// All sensitive values are loaded from environment variables (see .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'databaseURL', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.error(`Firebase config missing required keys: ${missingKeys.join(', ')}. Please check environment variables.`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment and with valid config
let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics failed to initialize:', error.message);
  }
}

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export { app };
export default app;
