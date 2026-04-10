import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetsClient from './BudgetsClient'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .order('name')

  // Get this month's spending per category
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const { data: monthSpend } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('date', firstOfMonth.toISOString().split('T')[0])

  const spendByCategory: Record<string, number> = {}
  monthSpend?.forEach(t => {
    if (t.category_id) spendByCategory[t.category_id] = (spendByCategory[t.category_id] || 0) + Number(t.amount)
  })

  const { data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).single()

  return (
    <BudgetsClient
      initialBudgets={budgets || []}
      categories={categories || []}
      spendByCategory={spendByCategory}
      currency={profile?.currency || 'INR'}
      userId={user.id}
    />
  )
}
