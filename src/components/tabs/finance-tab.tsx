"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/firebase/auth";
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
    date: new Date().toISOString().split('T')[0]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!userId || !newExpense.category || newExpense.value <= 0) return;

    try {
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
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error adding expense:", error);
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
          <h3 className="text-lg font-semibold">Expenses</h3>
          <div className="grid grid-cols-4 gap-2">
            <Input
              placeholder="Category"
              value={newExpense.category}
              onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={newExpense.value || ''}
              onChange={(e) => setNewExpense({...newExpense, value: Number(e.target.value)})}
            />
            <Input
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
            />
            <Button onClick={handleAddExpense}>Add Expense</Button>
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
                {expenses.map((expense) => (
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
