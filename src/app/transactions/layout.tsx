import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userName={userName} />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', paddingTop: '0' }}>
        <div style={{ paddingTop: 0 }}>
          {children}
        </div>
      </main>
      <style>{`
        @media (max-width: 767px) { main { padding-top: 60px !important; } }
      `}</style>
    </div>
  )
}
