import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAG4ftrEwOqe3jnh7tITeEZggKhi5cMzCY",
  authDomain: "mascafe-menu.firebaseapp.com",
  projectId: "mascafe-menu",
  storageBucket: "mascafe-menu.firebasestorage.app",
  messagingSenderId: "494301178936",
  appId: "1:494301178936:web:686c72e9c55adaff4e4acd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence to reduce reads and handle 5000+ daily opens efficiently
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});
