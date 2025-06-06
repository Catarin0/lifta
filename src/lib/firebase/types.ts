export interface FinanceData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface Expense {
  id?: string;
  category: string;
  value: number;
  description: string;
  date: string;
}

export interface HealthData {
  dailySteps: number;
  heartRate: number;
  sleepHours: number;
}
