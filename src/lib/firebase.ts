// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "humanet-techlearners.firebaseapp.com",
  projectId: "humanet-techlearners",
  storageBucket: "humanet-techlearners.firebasestorage.app",
  messagingSenderId: "60358514915",
  appId: "1:60358514915:web:7fcf669745d5bfa8b14dd6",
  measurementId: "G-L68V3WTHB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
