import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration with hardcoded values
const firebaseConfig = {
  apiKey: "AIzaSyBrSXvvYHwsoWeYZkVbpDF8FXpr2wZnq-Y",
  authDomain: "collab-canvas-2e4c5.firebaseapp.com",
  projectId: "collab-canvas-2e4c5",
  storageBucket: "collab-canvas-2e4c5.firebasestorage.app",
  messagingSenderId: "648585977625",
  appId: "1:648585977625:web:941c261c3e83dbe3cd6f88",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance for potential future use
export { app };

// Shared canvas ID constant - all users collaborate on this canvas
export const SHARED_CANVAS_ID = 'shared';
