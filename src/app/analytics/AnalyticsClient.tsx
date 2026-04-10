'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { Transaction } from '@/lib/types'
import { formatCurrency, CATEGORY_ICONS } from '@/lib/utils'
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react'

interface Props { transactions: Transaction[]; currency: string }

const COLORS = ['#5b8dee', '#00d084', '#ff4757', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#a855f7', '#f97316']

const CustomTooltip = ({ active, payload, label, currency }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string; currency: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsClient({ transactions, currency }: Props) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null)

  // Monthly data for last 12 months
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number; savings: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1)
      const key = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      months[key] = { month: label, income: 0, expense: 0, savings: 0 }
    }
    transactions.forEach(t => {
      const key = t.date.slice(0, 7)
      if (months[key]) {
        if (t.type === 'income') months[key].income += Number(t.amount)
        else months[key].expense += Number(t.amount)
      }
    })
    Object.values(months).forEach(m => { m.savings = m.income - m.expense })
    return Object.values(months)
  }, [transactions])

  // Category breakdown by type
  const categoryExpense = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; icon: string; count: number }> = {}
    const src = activeMonth ? transactions.filter(t => t.date.startsWith(activeMonth)) : transactions
    src.filter(t => t.type === 'expense').forEach(t => {
      const k = t.categories?.name || 'Other'
      if (!map[k]) map[k] = { name: k, amount: 0, color: t.categories?.color || '#6b7280', icon: t.categories?.icon || 'circle', count: 0 }
      map[k].amount += Number(t.amount); map[k].count++
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [transactions, activeMonth])

  const categoryIncome = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {}
    const src = activeMonth ? transactions.filter(t => t.date.startsWith(activeMonth)) : transactions
    src.filter(t => t.type === 'income').forEach(t => {
      const k = t.categories?.name || 'Other'
      if (!map[k]) map[k] = { name: k, amount: 0, color: t.categories?.color || '#6b7280', count: 0 }
      map[k].amount += Number(t.amount); map[k].count++
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [transactions, activeMonth])

  const totalExpense = categoryExpense.reduce((s, c) => s + c.amount, 0)
  const totalIncome = categoryIncome.reduce((s, c) => s + c.amount, 0)

  const bestMonth = useMemo(() => monthlyData.reduce((best, m) => m.savings > best.savings ? m : best, monthlyData[0] || { month: '-', savings: 0 }), [monthlyData])
  const avgSavings = useMemo(() => { const valid = monthlyData.filter(m => m.income > 0); return valid.length ? valid.reduce((s, m) => s + m.savings, 0) / valid.length : 0 }, [monthlyData])

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Analytics</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Last 12 months deep dive</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Income', value: formatCurrency(transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), currency), icon: TrendingUp, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
          { label: 'Total Expenses', value: formatCurrency(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), currency), icon: TrendingDown, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
          { label: 'Best Month', value: bestMonth.month, sub: formatCurrency(bestMonth.savings, currency) + ' saved', icon: Award, color: 'var(--accent-gold)', bg: '#f59e0b20' },
          { label: 'Avg Monthly Savings', value: formatCurrency(avgSavings, currency), icon: Target, color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
              <div style={{ width: '28px', height: '28px', background: bg, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color, fontFamily: 'monospace' }}>{value}</div>
            {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Month filter hint */}
      <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Filter by month:</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveMonth(null)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: '500', borderColor: !activeMonth ? 'var(--accent-blue)' : 'var(--border)', background: !activeMonth ? 'var(--accent-blue-dim)' : 'transparent', color: !activeMonth ? 'var(--accent-blue)' : 'var(--text-muted)' }}>All</button>
          {monthlyData.slice(-6).map(m => {
            const key = (() => { const d = new Date(); for (let i = 11; i >= 0; i--) { const dd = new Date(); dd.setMonth(dd.getMonth() - i); dd.setDate(1); if (dd.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) === m.month) return dd.toISOString().slice(0, 7) } return '' })()
            return (
              <button key={m.month} onClick={() => setActiveMonth(key === activeMonth ? null : key)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: '500', borderColor: activeMonth === key ? 'var(--accent-blue)' : 'var(--border)', background: activeMonth === key ? 'var(--accent-blue-dim)' : 'transparent', color: activeMonth === key ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                {m.month}
              </button>
            )
          })}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
        {/* Monthly bar chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Monthly Overview</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Income, expenses & savings per month</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', paddingTop: '12px' }} />
              <Bar dataKey="income" name="Income" fill="#00d084" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ff4757" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" name="Savings" fill="#5b8dee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings line chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Savings Trend</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>How much you saved each month</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#5b8dee" strokeWidth={2.5} dot={{ fill: '#5b8dee', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Expense categories */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Top Expenses</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{activeMonth || 'All time'}</p>
            {categoryExpense.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>No expense data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={categoryExpense} cx="50%" cy="50%" outerRadius={65} dataKey="amount" paddingAngle={2}>
                      {categoryExpense.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {categoryExpense.slice(0, 5).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{CATEGORY_ICONS[c.icon] || '📂'} {c.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-red)' }}>{formatCurrency(c.amount, currency)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Income categories */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Income Sources</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{activeMonth || 'All time'}</p>
            {categoryIncome.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>No income data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={categoryIncome} cx="50%" cy="50%" outerRadius={65} dataKey="amount" paddingAngle={2}>
                      {categoryIncome.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {categoryIncome.slice(0, 5).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{c.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-green)' }}>{formatCurrency(c.amount, currency)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{totalIncome > 0 ? Math.round((c.amount / totalIncome) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
