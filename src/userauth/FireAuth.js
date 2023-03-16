// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBqEaIk2X6dbSgMBfWWnrOOpnvOD9AuzTs",
  authDomain: "ar-hub-d45d1.firebaseapp.com",
  projectId: "ar-hub-d45d1",
  storageBucket: "ar-hub-d45d1.appspot.com",
  messagingSenderId: "275466964793",
  appId: "1:275466964793:web:d76e364c1b0aba26c9e2e8",
  measurementId: "G-YZPT74GYLZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app); 