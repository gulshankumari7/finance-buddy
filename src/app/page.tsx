// import { redirect } from 'next/navigation'
// import { createClient } from '@/lib/supabase/server'

// export default async function HomePage() {
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (user) redirect('/dashboard')
//   else redirect('/login')
// }
export default function Home() {
  return (
    <div style={{padding: "20px"}}>
      <h1>Finance Buddy ✅</h1>
      <p>Your app is working!</p>
    </div>
  );
}
