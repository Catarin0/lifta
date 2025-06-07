import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  deleteDoc,
  getDocs,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// Initialize Firestore independently to avoid circular dependencies
const firebaseConfig = {
  projectId: "lifta-2009a",
  apiKey: "AIzaSyAgL1tR0ODpV5RwnpL2j3EjctEDrVlQJxo",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

import type { UserDetails, Expense } from "./types";

// User details operations
export const updateUserDetails = async (userId: string, data: UserDetails) => {
  const userDetailsRef = doc(db, "users", userId, "user_details", "finance");
  await setDoc(userDetailsRef, data, { merge: true });
};

export const getUserDetails = async (userId: string): Promise<UserDetails | null> => {
  const userDetailsRef = doc(db, "users", userId, "user_details", "finance");
  const docSnap = await getDoc(userDetailsRef);
  return docSnap.exists() ? docSnap.data() as UserDetails : null;
};

// Expense operations
export const addExpense = async (userId: string, expense: Omit<Expense, 'id'>) => {
  const expensesRef = collection(db, "users", userId, "expenses");
  // Ensure expense data is properly formatted
  const expenseData = {
    category: expense.category,
    value: Number(expense.value),
    description: expense.description,
    date: expense.date
  };
  
  // Get current user details
  const userDetails = await getUserDetails(userId);
  if (!userDetails) {
    throw new Error("User details not found");
  }

  // Update total balance
  const newBalance = userDetails.totalBalance - expenseData.value;
  await updateUserDetails(userId, {
    ...userDetails,
    totalBalance: newBalance
  });

  const docRef = await addDoc(expensesRef, expenseData);
  return docRef.id;
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, "users", userId, "expenses");
  const querySnapshot = await getDocs(expensesRef);
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  } as Expense));
};

export const deleteExpense = async (userId: string, expenseId: string) => {
  const expenseRef = doc(db, "users", userId, "expenses", expenseId);
  
  // Get the expense value before deleting
  const expenseDoc = await getDoc(expenseRef);
  if (!expenseDoc.exists()) {
    throw new Error("Expense not found");
  }
  
  const expenseData = expenseDoc.data() as Expense;
  
  // Get current user details
  const userDetails = await getUserDetails(userId);
  if (!userDetails) {
    throw new Error("User details not found");
  }

  // Update total balance
  const newBalance = userDetails.totalBalance + expenseData.value;
  await updateUserDetails(userId, {
    ...userDetails,
    totalBalance: newBalance
  });

  await deleteDoc(expenseRef);
};

// Export types for use in components
export type { UserDetails, Expense };
