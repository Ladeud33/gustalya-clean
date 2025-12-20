// firebase.js - Configuration Firebase COMPLÈTE
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCn2qN0V4ePf0m4iAtNya6p-dS5bHH0Q1s",
  authDomain: "gustalya.firebaseapp.com",
  projectId: "gustalya",
  storageBucket: "gustalya.firebasestorage.app",
  messagingSenderId: "53958164452",
  appId: "1:53958164452:web:a0b3d34ae17750c37fd1f1",
  measurementId: "G-N0YB9BJ9H1"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export de tous les services Firebase
export { 
  app, 
  auth, 
  db, 
  analytics,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
