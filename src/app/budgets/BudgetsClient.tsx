'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Budget, Category } from '@/lib/types'
import { formatCurrency, CATEGORY_ICONS } from '@/lib/utils'
import { Plus, X, Loader2, Trash2, AlertTriangle, ChevronDown, Target } from 'lucide-react'

interface Props {
  initialBudgets: Budget[]
  categories: Category[]
  spendByCategory: Record<string, number>
  currency: string
  userId: string
}

interface BudgetForm { name: string; category_id: string; amount: string; period: 'weekly' | 'monthly' | 'yearly' }
const defaultForm: BudgetForm = { name: '', category_id: '', amount: '', period: 'monthly' }

export default function BudgetsClient({ initialBudgets, categories, spendByCategory, currency, userId }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<BudgetForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSave = async () => {
    if (!form.name || !form.amount) { setError('Name and amount are required'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const start = new Date(); start.setDate(1)
    const { data, error: err } = await supabase
      .from('budgets')
      .insert({ user_id: userId, name: form.name, category_id: form.category_id || null, amount: parseFloat(form.amount), period: form.period, start_date: start.toISOString().split('T')[0] })
      .select('*, categories(*)')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    setBudgets(prev => [data, ...prev])
    setShowModal(false); setForm(defaultForm); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
    setDeletingId(null)
  }

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.category_id ? (spendByCategory[b.category_id] || 0) : 0), 0)

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Budgets</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Set limits and track your spending</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowModal(true); setForm(defaultForm); setError('') }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> New Budget
        </button>
      </div>

      {/* Overview */}
      {budgets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Budgeted</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{formatCurrency(totalBudget, currency)}</div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Spent</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-red)', fontFamily: 'monospace' }}>{formatCurrency(totalSpent, currency)}</div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Remaining</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: totalBudget - totalSpent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'monospace' }}>{formatCurrency(totalBudget - totalSpent, currency)}</div>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Target size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>No budgets yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Create budgets to keep your spending in check</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {budgets.map(budget => {
            const spent = budget.category_id ? (spendByCategory[budget.category_id] || 0) : 0
            const pct = Math.min((spent / Number(budget.amount)) * 100, 100)
            const remaining = Number(budget.amount) - spent
            const isOver = spent > Number(budget.amount)
            const isWarning = pct >= 80 && !isOver
            const barColor = isOver ? 'var(--accent-red)' : isWarning ? 'var(--accent-gold)' : 'var(--accent-green)'

            return (
              <div key={budget.id} className="card card-hover" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isOver ? 'var(--accent-red-dim)' : 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {budget.categories ? CATEGORY_ICONS[budget.categories.icon] || '📂' : '🎯'}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{budget.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {budget.period} · {budget.categories?.name || 'All categories'}
                        {isOver && <span style={{ marginLeft: '8px', color: 'var(--accent-red)', fontWeight: '600' }}><AlertTriangle size={10} style={{ display: 'inline' }} /> Over budget!</span>}
                        {isWarning && <span style={{ marginLeft: '8px', color: 'var(--accent-gold)', fontWeight: '600' }}>⚠ Almost there</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: barColor, fontFamily: 'monospace' }}>{formatCurrency(spent, currency)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>of {formatCurrency(Number(budget.amount), currency)}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-red)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-red-dim)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'none' }}
                    >
                      {deletingId === budget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{Math.round(pct)}% used</span>
                  <span style={{ color: remaining >= 0 ? 'var(--text-secondary)' : 'var(--accent-red)' }}>
                    {remaining >= 0 ? `${formatCurrency(remaining, currency)} left` : `${formatCurrency(Math.abs(remaining), currency)} over`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: '#00000070', backdropFilter: 'blur(4px)' }} />
          <div className="card animate-in" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '28px', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>New Budget</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Budget Name *</label>
                <input className="input" type="text" placeholder="e.g. Monthly Food Budget" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category (optional)</label>
                <div style={{ position: 'relative' }}>
                  <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={{ appearance: 'none', paddingRight: '32px' }}>
                    <option value="">All expense categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{CATEGORY_ICONS[c.icon] || '📂'} {c.name}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Budget Amount (₹) *</label>
                <input className="input" type="number" placeholder="5000" min="0" step="100" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Period</label>
                <div style={{ position: 'relative' }}>
                  <select className="input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value as 'weekly' | 'monthly' | 'yearly' }))} style={{ appearance: 'none', paddingRight: '32px' }}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              {error && <div style={{ background: 'var(--accent-red-dim)', border: '1px solid #ff475740', borderRadius: '8px', padding: '10px 14px', color: 'var(--accent-red)', fontSize: '13px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Create Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
