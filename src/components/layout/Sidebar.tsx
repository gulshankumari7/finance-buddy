'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ArrowUpDown, BarChart3, Target, TrendingUp, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowUpDown },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/budgets', label: 'Budgets', icon: Target },
]

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 16px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '32px' }}>
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #5b8dee, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>Finance Buddy</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Smart Tracker</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
                background: active ? 'linear-gradient(135deg, #5b8dee20, #8b5cf620)' : 'transparent',
                border: active ? '1px solid #5b8dee30' : '1px solid transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: active ? '600' : '400',
                fontSize: '14px',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={18} style={{ color: active ? 'var(--accent-blue)' : 'inherit', flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
        <div style={{ padding: '10px 12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{userName || 'User'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Free plan</div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '14px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-red)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-red-dim)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)', height: '100vh',
        position: 'sticky', top: 0,
      }} className="hidden-mobile">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="show-mobile" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b8dee, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={14} color="white" />
          </div>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>Finance Buddy</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, display: 'flex' }} className="show-mobile">
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: '#00000080' }} />
          <div style={{ position: 'relative', width: '240px', background: 'var(--bg-secondary)', height: '100%', zIndex: 1 }}>
            <SidebarContent />
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .hidden-mobile { display: block !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </>
  )
}
