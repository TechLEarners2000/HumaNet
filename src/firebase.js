// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALN7uKSZXPyg6V5_6rf_Qs2wM3Lyxhv8c",
  authDomain: "humanet-techlearners.firebaseapp.com",
  projectId: "humanet-techlearners",
  storageBucket: "humanet-techlearners.firebasestorage.app",
  messagingSenderId: "60358514915",
  appId: "1:60358514915:web:7fcf669745d5bfa8b14dd6",
  measurementId: "G-L68V3WTHB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);