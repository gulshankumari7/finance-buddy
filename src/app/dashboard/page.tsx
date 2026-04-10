import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // This month's transactions
  const { data: monthTransactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .gte('date', firstOfMonth)
    .lte('date', lastOfMonth)
    .order('date', { ascending: false })

  // Last 6 months data
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(8)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, currency')
    .eq('id', user.id)
    .single()

  return (
    <DashboardClient
      monthTransactions={monthTransactions || []}
      allTransactions={allTransactions || []}
      recentTransactions={recentTransactions || []}
      currency={profile?.currency || 'INR'}
      userName={profile?.full_name || 'there'}
    />
  )
}
