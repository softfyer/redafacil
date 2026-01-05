// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add your own Firebase configuration and initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyChYQcSfp_y7WIJbtQ32GQnAm29K-Mpc0I",
  authDomain: "redafcil.firebaseapp.com",
  projectId: "redafcil",
  storageBucket: "redafcil.firebasestorage.app",
  messagingSenderId: "905264553510",
  appId: "1:905264553510:web:8fa05b7abcaadc07f590e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
