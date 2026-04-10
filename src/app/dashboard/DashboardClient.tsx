'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Transaction } from '@/lib/types'
import { formatCurrency, getLast6Months, CATEGORY_ICONS } from '@/lib/utils'

interface Props {
  monthTransactions: Transaction[]
  allTransactions: Transaction[]
  recentTransactions: Transaction[]
  currency: string
  userName: string
}

const CustomTooltip = ({ active, payload, label, currency }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string; currency: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
        {payload.map((p) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(p.value, currency)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardClient({ monthTransactions, allTransactions, recentTransactions, currency, userName }: Props) {
  const monthIncome = useMemo(() => monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), [monthTransactions])
  const monthExpense = useMemo(() => monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [monthTransactions])
  const balance = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0

  // 6-month trend
  const trendData = useMemo(() => {
    const months = getLast6Months()
    return months.map(m => {
      const txs = allTransactions.filter(t => t.date.startsWith(m))
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const d = new Date(m + '-01')
      return { month: d.toLocaleDateString('en-IN', { month: 'short' }), income, expense }
    })
  }, [allTransactions])

  // Category breakdown (expenses this month)
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string }> = {}
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.categories
      const key = cat?.name || 'Other'
      if (!map[key]) map[key] = { name: key, amount: 0, color: cat?.color || '#6b7280' }
      map[key].amount += Number(t.amount)
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 6)
  }, [monthTransactions])

  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {userName} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{currentMonth} overview</p>
        </div>
        <Link href="/transactions" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Transaction
          </button>
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Income', value: monthIncome, icon: TrendingUp, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', glowClass: 'glow-green' },
          { label: 'Total Expenses', value: monthExpense, icon: TrendingDown, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', glowClass: 'glow-red' },
          { label: 'Net Balance', value: balance, icon: Wallet, color: balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', bg: balance >= 0 ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)', glowClass: '' },
          { label: 'Savings Rate', value: null, display: `${savingsRate}%`, icon: ArrowUpRight, color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)', glowClass: 'glow-blue' },
        ].map(({ label, value, display, icon: Icon, color, bg, glowClass }) => (
          <div key={label} className={`card card-hover ${glowClass}`} style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
              <div style={{ width: '32px', height: '32px', background: bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '700', color, fontFamily: 'var(--font-dm-mono, monospace)' }}>
              {display || formatCurrency(value!, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '24px' }}>
        {/* Area chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Income vs Expenses</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Last 6 months trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d084" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4757" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#00d084" strokeWidth={2} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#ff4757" strokeWidth={2} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Spending by Category</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>This month</p>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="amount" paddingAngle={2}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {categoryData.slice(0, 4).map(cat => (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{formatCurrency(cat.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No expenses this month</div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>Recent Transactions</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Your latest activity</p>
          </div>
          <Link href="/transactions" style={{ textDecoration: 'none', fontSize: '13px', color: 'var(--accent-blue)', fontWeight: '500' }}>View all →</Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            No transactions yet. <Link href="/transactions" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Add your first one!</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recentTransactions.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px', borderRadius: '10px', transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: tx.type === 'income' ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                  }}>
                    {CATEGORY_ICONS[tx.categories?.icon || 'circle'] || '💰'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{tx.description || tx.categories?.name || 'Transaction'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {tx.categories?.name} · {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tx.type === 'income'
                    ? <ArrowUpRight size={14} style={{ color: 'var(--accent-green)' }} />
                    : <ArrowDownRight size={14} style={{ color: 'var(--accent-red)' }} />}
                  <span style={{
                    fontWeight: '600', fontSize: '15px',
                    color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)',
                    fontFamily: 'var(--font-dm-mono, monospace)'
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount), currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
