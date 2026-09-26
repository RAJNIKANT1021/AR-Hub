import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqEaIk2X6dbSgMBfWWnrOOpnvOD9AuzTs",
  authDomain: "ar-hub-d45d1.firebaseapp.com",
  projectId: "ar-hub-d45d1",
  storageBucket: "ar-hub-d45d1.appspot.com",
  messagingSenderId: "275466964793",
  appId: "1:275466964793:web:d76e364c1b0aba26c9e2e8",
  measurementId: "G-YZPT74GYLZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Local development against the Firebase emulator suite:
//   REACT_APP_USE_EMULATOR=true npm start   (with `firebase emulators:start` running)
if (process.env.REACT_APP_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

// Offline cache: chats/messages load instantly and queued writes survive reloads.
enableMultiTabIndexedDbPersistence(db).catch(() => {});
