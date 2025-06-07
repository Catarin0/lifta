"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Plus, Minus, ChevronDown } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  updateUserDetails, 
  getUserDetails, 
  type UserDetails,
  addExpense,
  getExpenses,
  deleteExpense,
  type Expense
} from "@/lib/firebase/db";

export function FinanceTab() {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    totalBalance: 0,
    monthlyIncome: 0,
    firstName: '',
    lastName: '',
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
  const [alert, setAlert] = useState<{type: 'default' | 'destructive', message: string} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const [details, expensesList] = await Promise.all([
          getUserDetails(userId),
          getExpenses(userId)
        ]);
        
        if (details) setUserDetails(details);
        setExpenses(expensesList);
      }
    };

    loadData();
  }, []);

  const getExpensesForMonth = (year: number, month: number) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesYear = expenseDate.getFullYear() === year;
      const matchesMonth = expenseDate.getMonth() + 1 === month;
      const matchesCategory = !filters.category || expense.category === filters.category;
      return matchesYear && matchesMonth && matchesCategory;
    });
  };

  const filteredExpenses = getExpensesForMonth(filters.year, filters.month);

  // Get previous month's expenses
  const getPreviousMonthExpenses = () => {
    const prevMonth = filters.month === 1 ? 12 : filters.month - 1;
    const prevYear = filters.month === 1 ? filters.year - 1 : filters.year;
    return getExpensesForMonth(prevYear, prevMonth);
  };

  const currentMonthTotal = filteredExpenses.reduce((sum, exp) => sum + exp.value, 0);
  const previousMonthTotal = getPreviousMonthExpenses().reduce((sum, exp) => sum + exp.value, 0);
  
  const getPercentageChange = () => {
    if (previousMonthTotal === 0) return null;
    const change = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
    return change;
  };

  const percentageChange = getPercentageChange();

  const handleSaveUserDetails = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateUserDetails(userId, userDetails);
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
      // Check if user details exist first
      const existingUserDetails = await getUserDetails(userId);
      if (!existingUserDetails) {
        // Initialize user details if they don't exist
        await updateUserDetails(userId, {
          totalBalance: 0,
          monthlyIncome: 0,
          firstName: '',
          lastName: ''
        });
      }
      
      await addExpense(userId, newExpense);
      const updatedExpenses = await getExpenses(userId);
      setExpenses(updatedExpenses);
      
      // Get updated user details after expense is added
      const updatedUserDetails = await getUserDetails(userId);
      if (updatedUserDetails) setUserDetails(updatedUserDetails);

      // Show success alert
      setAlert({
        type: 'default',
        message: 'Expense added successfully'
      });
      setTimeout(() => setAlert(null), 3000);

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
      
      // Get updated user details after expense is deleted
      const updatedUserDetails = await getUserDetails(userId);
      if (updatedUserDetails) setUserDetails(updatedUserDetails);

      // Show success alert
      setAlert({
        type: 'default',
        message: 'Expense deleted successfully'
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Error deleting expense:", error);
      setAlert({
        type: 'destructive',
        message: 'Failed to delete expense'
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
        {alert && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
            <Alert variant={alert.type}>
              <AlertTitle>{alert.type === 'default' ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Financial Overview</h2>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 sm:h-full min-h-[80px]">
              <CardContent className="p-1.5 sm:p-3">
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Balance</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={userDetails.totalBalance}
                    onChange={(e) => setUserDetails({ ...userDetails, totalBalance: Number(e.target.value) })}
                    className="mt-0.5 h-6 sm:h-7 text-xs"
                  />
                ) : (
                  <div className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1">{formatCurrency(userDetails.totalBalance)}</div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 sm:h-full min-h-[80px]">
              <CardContent className="p-1.5 sm:p-3">
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Income</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={userDetails.monthlyIncome}
                    onChange={(e) => setUserDetails({ ...userDetails, monthlyIncome: Number(e.target.value) })}
                    className="mt-0.5 h-6 sm:h-7 text-xs"
                  />
                ) : (
                  <div className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1">{formatCurrency(userDetails.monthlyIncome)}</div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 sm:h-full min-h-[80px]">
              <CardContent className="p-1.5 sm:p-3">
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Expenses</div>
                <div className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1">{formatCurrency(currentMonthTotal)}</div>
                {percentageChange !== null && (
                  <div className={`text-[9px] sm:text-xs mt-0.5 sm:mt-1 ${percentageChange > 0 ? 'text-red-500' : percentageChange < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUserDetails} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h3 className="text-lg font-semibold">Expenses</h3>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
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
                  <Button variant="outline" size="sm" className="text-xs">
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
                  <Button variant="outline" size="sm" className="text-xs">
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
                  <Button size="sm" className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(80vw,320px)] p-4 md:w-80">
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
                      className="h-10"
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
          
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-full sm:min-w-[600px] text-xs sm:text-sm">
              <TableHeader className="bg-background/50">
                <TableRow>
                  <TableHead className="px-2 sm:px-4 py-2 font-medium">Category</TableHead>
                  <TableHead className="px-2 sm:px-4 py-2 font-medium text-center">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell px-4 py-2 font-medium">Description</TableHead>
                  <TableHead className="hidden sm:table-cell px-2 sm:px-4 py-2 font-medium whitespace-nowrap">Date</TableHead>
                  <TableHead className="hidden sm:table-cell px-2 sm:px-4 py-2 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <Drawer key={expense.id}>
                    <DrawerTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="px-2 sm:px-4 py-2 font-medium">{expense.category}</TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 text-center">{formatCurrency(expense.value)}</TableCell>
                        <TableCell className="hidden sm:table-cell px-4 py-2 text-muted-foreground">{expense.description}</TableCell>
                        <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {expense.date.split('T')[0]}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2">
                          <Button 
                            variant="destructive" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              expense.id && handleDeleteExpense(expense.id);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell className="sm:hidden px-1 py-1">
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    </DrawerTrigger>
                    <DrawerContent className="sm:hidden">
                      <DrawerHeader>
                        <DrawerTitle>{expense.category}</DrawerTitle>
                      </DrawerHeader>
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p>{expense.description || 'No description'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p>{expense.date.split('T')[0]}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p>{formatCurrency(expense.value)}</p>
                        </div>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => expense.id && handleDeleteExpense(expense.id)}
                        >
                          Delete Expense
                        </Button>
                      </div>
                    </DrawerContent>
                  </Drawer>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
    </div>
  );
}
