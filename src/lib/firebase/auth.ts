import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp, getApps, FirebaseError } from "firebase/app";

// Initialize Firebase only if it hasn't been initialized already
export const app = getApps().length === 0 ? initializeApp({
  projectId: "lifta-2009a",
  apiKey: "AIzaSyAgL1tR0ODpV5RwnpL2j3EjctEDrVlQJxo",
}) : getApps()[0];

const auth = getAuth(app);

import { doc, setDoc } from "firebase/firestore";
import { db } from "./db";

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Initialize user collections after signup
    const userId = userCredential.user.uid;
    await Promise.all([
      setDoc(doc(db, "users", userId, "data", "finance"), {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0
      }),
      setDoc(doc(db, "users", userId, "data", "health"), {
        dailySteps: 0,
        heartRate: 0,
        sleepHours: 0
      })
    ]);

    return { user: userCredential.user, error: null };
  } catch (error) {
    const firebaseError = error as FirebaseError;
    return { user: null, error: firebaseError.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    const firebaseError = error as FirebaseError;
    return { user: null, error: firebaseError.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export { auth };
