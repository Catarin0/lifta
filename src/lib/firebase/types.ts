export interface UserDetails {
  totalBalance: number;
  monthlyIncome: number;
  firstName: string;
  lastName: string;
}

export interface Expense {
  id?: string;
  category: string;
  value: number;
  description: string;
  date: string;
}
