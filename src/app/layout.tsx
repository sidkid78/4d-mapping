import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MainNav } from '@/components/main-nav'  // Add this import

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Procurity.ai',
  description: 'Advanced Regulatory Mapping System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container mx-auto py-4">
            <MainNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}commiti