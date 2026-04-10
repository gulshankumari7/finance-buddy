// import { redirect } from 'next/navigation'
// import { createClient } from '@/lib/supabase/server'

// export default async function HomePage() {
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (user) redirect('/dashboard')
//   else redirect('/login')
// }
"use client";
import { useState } from "react";

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");

  const addExpense = () => {
    if (!amount) return;
    setExpenses([...expenses, amount]);
    setAmount("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Finance Buddy</h1>
      <p>Track your expenses easily</p>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={addExpense}>Add Expense</button>

      <ul>
        {expenses.map((exp, index) => (
          <li key={index}>₹ {exp}</li>
        ))}
      </ul>
    </div>
  );
}
