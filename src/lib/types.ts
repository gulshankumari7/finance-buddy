export type TransactionType = 'income' | 'expense'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  categories?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string | null
  name: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  created_at: string
  categories?: Category
}

export interface DashboardStats {
  totalIncome: number
  totalExpense: number
  balance: number
  savingsRate: number
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
}

export interface CategorySpend {
  name: string
  amount: number
  color: string
  percentage: number
}
