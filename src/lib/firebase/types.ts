export interface UserDetails {
  totalBalance: number;
  monthlyIncome: number;
}

export interface Expense {
  id?: string;
  category: string;
  value: number;
  description: string;
  date: string;
}
