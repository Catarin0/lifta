"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  updateFinanceData, 
  getFinanceData, 
  type FinanceData,
  addExpense,
  getExpenses,
  deleteExpense,
  type Expense
} from "@/lib/firebase/db";

export function FinanceTab() {
  const [financeData, setFinanceData] = useState<FinanceData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    category: '',
    value: 0,
    description: '',
    date: (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })()
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    category: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const [finance, expenses] = await Promise.all([
          getFinanceData(userId),
          getExpenses(userId)
        ]);
        
        if (finance) setFinanceData(finance);
        setExpenses(expenses);
      }
    };

    loadData();
  }, []);

  // Calculate filtered expenses total
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const matchesYear = expenseDate.getFullYear() === filters.year;
    const matchesMonth = expenseDate.getMonth() + 1 === filters.month;
    const matchesCategory = !filters.category || expense.category === filters.category;
    return matchesYear && matchesMonth && matchesCategory;
  });

  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.value, 0);

  useEffect(() => {
    setFinanceData(prev => ({
      ...prev,
      monthlyExpenses: filteredTotal
    }));
  }, [filters, filteredTotal]);

  const handleSaveFinanceData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateFinanceData(userId, financeData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving data:", error);
    }
    setIsSaving(false);
  };

  const handleAddExpense = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    if (!newExpense.category) {
      console.error('No category selected');
      return;
    }
    if (newExpense.value <= 0) {
      console.error('Invalid amount');
      return;
    }

    try {
      setError(null);
      console.log('Current user:', auth.currentUser);
      console.log('Adding expense:', { ...newExpense });
      await addExpense(userId, newExpense);
      const updatedExpenses = await getExpenses(userId);
      setExpenses(updatedExpenses);
      
      // Update monthly expenses
      const totalExpenses = updatedExpenses.reduce((sum, exp) => sum + exp.value, 0);
      setFinanceData(prev => ({
        ...prev,
        monthlyExpenses: totalExpenses
      }));
      await updateFinanceData(userId, {
        ...financeData,
        monthlyExpenses: totalExpenses
      });

      // Reset form
      setNewExpense({
        category: '',
        value: 0,
        description: '',
        date: (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })()
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      console.error("Failed expense data:", { ...newExpense });
      setError("Failed to add expense. Please try again.");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await deleteExpense(userId, expenseId);
      const updatedExpenses = await getExpenses(userId);
      setExpenses(updatedExpenses);
      
      // Update monthly expenses
      const totalExpenses = updatedExpenses.reduce((sum, exp) => sum + exp.value, 0);
      setFinanceData(prev => ({
        ...prev,
        monthlyExpenses: totalExpenses
      }));
      await updateFinanceData(userId, {
        ...financeData,
        monthlyExpenses: totalExpenses
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Financial Overview</h2>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Total Balance</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={financeData.totalBalance}
                    onChange={(e) => setFinanceData({ ...financeData, totalBalance: Number(e.target.value) })}
                    className="mt-2"
                  />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(financeData.totalBalance)}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Monthly Income</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={financeData.monthlyIncome}
                    onChange={(e) => setFinanceData({ ...financeData, monthlyIncome: Number(e.target.value) })}
                    className="mt-2"
                  />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(financeData.monthlyIncome)}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Monthly Expenses</div>
                <div className="text-2xl font-bold">{formatCurrency(financeData.monthlyExpenses)}</div>
              </CardContent>
            </Card>
          </div>
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFinanceData} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expenses</h3>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {filters.year || "Select Year"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={filters.year.toString()} onValueChange={(value) => setFilters({...filters, year: parseInt(value)})}>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <DropdownMenuRadioItem key={year} value={year.toString()}>{year}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {filters.month ? new Date(2000, filters.month - 1).toLocaleString('default', { month: 'long' }) : "Select Month"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={filters.month.toString()} onValueChange={(value) => setFilters({...filters, month: parseInt(value)})}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <DropdownMenuRadioItem key={month} value={month.toString()}>
                        {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {filters.category || "All Categories"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                    <DropdownMenuRadioItem value="">All Categories</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Investments">Investments</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Grocery">Grocery</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Bills">Bills</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Entertainment">Entertainment</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Transportation">Transportation</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Healthcare">Healthcare</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Other">Other</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" className="h-8 w-8 shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Add New Expense</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter the details for your new expense.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {newExpense.category || "Select Category"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuRadioGroup 
                          value={newExpense.category} 
                          onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                        >
                          <DropdownMenuRadioItem value="Investments">Investments</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Grocery">Grocery</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Bills">Bills</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Entertainment">Entertainment</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Transportation">Transportation</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Healthcare">Healthcare</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Other">Other</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newExpense.value || ''}
                      onChange={(e) => setNewExpense({...newExpense, value: Number(e.target.value)})}
                      className="h-8"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="grid gap-2">
                    <DatePicker
                      label="Date"
                      value={newExpense.date}
                      onChange={(date) => setNewExpense({...newExpense, date})}
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-destructive">{error}</div>
                  )}
                  <Button onClick={handleAddExpense} className="w-full">
                    Add Expense
                  </Button>
                </div>
              </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatCurrency(expense.value)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.date.split('T')[0]}</TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => expense.id && handleDeleteExpense(expense.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
