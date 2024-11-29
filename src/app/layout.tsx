import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Procurity.ai - Advanced Orchestrator',
  description: 'Advanced system orchestration and management platform'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 bg-gradient-to-b from-[#E0F7FA] to-[#F0F0F0]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}