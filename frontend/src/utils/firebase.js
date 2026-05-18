import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Retrieve credentials from Vite env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verify if credentials are set
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Always force account selection prompt to give standard professional UX
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  } catch (error) {
    console.error("Failed to initialize Firebase app or Auth client:", error);
  }
} else {
  console.info(
    "Locker 24: Firebase environment variables are not configured.\n" +
    "Google Sign-In will operate in Developer Simulation/Demo Mode."
  );
}

export { auth, googleProvider, isFirebaseConfigured };
