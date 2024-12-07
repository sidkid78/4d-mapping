import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
  return (
    <main className="min-h-screen">
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Procurity.ai</h1>
      </div>
    </main>
  )
}