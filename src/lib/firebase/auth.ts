import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp, getApps, FirebaseError } from "firebase/app";

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp({
  projectId: "lifta-2009a",
  apiKey: "AIzaSyAgL1tR0ODpV5RwnpL2j3EjctEDrVlQJxo",
}) : getApps()[0];

const auth = getAuth(app);

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
