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

import type { FinanceData, Expense, HealthData } from "./types";

// Finance data operations
export const updateFinanceData = async (userId: string, data: FinanceData) => {
  const userFinanceRef = doc(db, "users", userId, "data", "finance");
  await setDoc(userFinanceRef, data, { merge: true });
};

export const getFinanceData = async (userId: string): Promise<FinanceData | null> => {
  const userFinanceRef = doc(db, "users", userId, "data", "finance");
  const docSnap = await getDoc(userFinanceRef);
  return docSnap.exists() ? docSnap.data() as FinanceData : null;
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
  await deleteDoc(expenseRef);
};

// Health data operations
export const updateHealthData = async (userId: string, data: HealthData) => {
  const userHealthRef = doc(db, "users", userId, "data", "health");
  await setDoc(userHealthRef, data, { merge: true });
};

export const getHealthData = async (userId: string): Promise<HealthData | null> => {
  const userHealthRef = doc(db, "users", userId, "data", "health");
  const docSnap = await getDoc(userHealthRef);
  return docSnap.exists() ? docSnap.data() as HealthData : null;
};

// Export types for use in components
export type { FinanceData, HealthData, Expense };
