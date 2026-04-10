'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction, Category } from '@/lib/types'
import { formatCurrency, CATEGORY_ICONS } from '@/lib/utils'
import { Plus, Search, Filter, Trash2, X, Loader2, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react'

interface Props {
  initialTransactions: Transaction[]
  categories: Category[]
  currency: string
  userId: string
}

interface TxForm {
  type: 'income' | 'expense'
  amount: string
  description: string
  category_id: string
  date: string
  notes: string
}

const defaultForm: TxForm = {
  type: 'expense',
  amount: '',
  description: '',
  category_id: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function TransactionsClient({ initialTransactions, categories, currency, userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<TxForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredCategories = categories.filter(c => c.type === form.type)

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = !search || tx.description?.toLowerCase().includes(search.toLowerCase()) || tx.categories?.name.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' || tx.type === filterType
      const matchCat = !filterCategory || tx.category_id === filterCategory
      return matchSearch && matchType && matchCat
    })
  }, [transactions, search, filterType, filterCategory])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const handleSave = async () => {
    if (!form.amount || !form.category_id) { setError('Amount and category are required'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description || null,
        category_id: form.category_id,
        date: form.date,
        notes: form.notes || null,
      })
      .select('*, categories(*)')
      .single()

    if (err) { setError(err.message); setSaving(false); return }
    setTransactions(prev => [data, ...prev])
    setShowModal(false)
    setForm(defaultForm)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeletingId(null)
  }

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {}
    filtered.forEach(tx => {
      const key = tx.date
      if (!map[key]) map[key] = []
      map[key].push(tx)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Transactions</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{transactions.length} total records</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowModal(true); setForm(defaultForm); setError('') }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Filtered Income</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-green)', fontFamily: 'monospace' }}>+{formatCurrency(totalIncome, currency)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Filtered Expenses</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-red)', fontFamily: 'monospace' }}>-{formatCurrency(totalExpense, currency)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select className="input" value={filterType} onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense')} style={{ paddingRight: '32px', minWidth: '120px', appearance: 'none' }}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select className="input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ paddingRight: '32px', minWidth: '140px', appearance: 'none' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
        {(search || filterType !== 'all' || filterCategory) && (
          <button className="btn-ghost" onClick={() => { setSearch(''); setFilterType('all'); setFilterCategory('') }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }}>
            <Filter size={14} /> Clear
          </button>
        )}
      </div>

      {/* Transaction list */}
      <div className="card">
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💸</div>
            <div style={{ fontSize: '15px', marginBottom: '6px', color: 'var(--text-secondary)' }}>No transactions found</div>
            <div style={{ fontSize: '13px' }}>Add your first transaction to get started</div>
          </div>
        ) : (
          grouped.map(([date, txs], gi) => (
            <div key={date}>
              <div style={{
                padding: '10px 20px', fontSize: '12px', fontWeight: '600',
                color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase',
                borderBottom: '1px solid var(--border-subtle)',
                background: gi > 0 ? 'transparent' : 'transparent',
                borderTop: gi > 0 ? '1px solid var(--border-subtle)' : 'none'
              }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {txs.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      background: tx.type === 'income' ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>
                      {CATEGORY_ICONS[tx.categories?.icon || 'circle'] || '💰'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{tx.description || tx.categories?.name || 'Transaction'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'}>{tx.type}</span>
                        {tx.categories && <span style={{ marginLeft: '6px' }}>{tx.categories.name}</span>}
                        {tx.notes && <span style={{ marginLeft: '6px' }}>· {tx.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        {tx.type === 'income' ? <ArrowUpRight size={14} style={{ color: 'var(--accent-green)' }} /> : <ArrowDownRight size={14} style={{ color: 'var(--accent-red)' }} />}
                        <span style={{ fontSize: '15px', fontWeight: '700', color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'monospace' }}>
                          {formatCurrency(Number(tx.amount), currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-red)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-red-dim)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'none' }}
                    >
                      {deletingId === tx.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: '#00000070', backdropFilter: 'blur(4px)' }} />
          <div className="card animate-in" style={{ position: 'relative', width: '100%', maxWidth: '460px', padding: '28px', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Add Transaction</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Type toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} onClick={() => { setForm(f => ({ ...f, type: t, category_id: '' })) }} style={{
                  padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.15s',
                  background: form.type === t ? (t === 'income' ? 'var(--accent-green)' : 'var(--accent-red)') : 'transparent',
                  color: form.type === t ? 'white' : 'var(--text-muted)',
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount (₹) *</label>
                <input className="input" type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                <div style={{ position: 'relative' }}>
                  <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={{ appearance: 'none', paddingRight: '32px' }}>
                    <option value="">Select category</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{CATEGORY_ICONS[c.icon] || '📂'} {c.name}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
                <input className="input" type="text" placeholder="What was this for?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes (optional)</label>
                <input className="input" type="text" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {error && <div style={{ background: 'var(--accent-red-dim)', border: '1px solid #ff475740', borderRadius: '8px', padding: '10px 14px', color: 'var(--accent-red)', fontSize: '13px' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
