import { initializeApp } from "firebase/app";
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOPRmvkNaMBpIOmvB7U2iVqnd5RKfr4LA",
  authDomain: "therapist-app-d7b51.firebaseapp.com",
  projectId: "therapist-app-d7b51",
  storageBucket: "therapist-app-d7b51.appspot.com",
  messagingSenderId: "348246726656",
  appId: "1:348246726656:web:c6fcf28e8b479be459a0e5",
  measurementId: "G-LT35EWRFQ1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);